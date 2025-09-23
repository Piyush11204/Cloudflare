import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { sendEmail } from "../utils/emailer.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { verifyTurnstile, verifyRecaptcha } from "../middlewares/verifyCaptcha.js";

const SALT_ROUNDS = 12;
const MAX_FAILED = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 mins

export const register = async (req, res) => {
  try {
    const { name, email, password, turnstileToken, recaptchaToken } = req.body;

    // verify captcha(s) - require at least one to pass (you can require both)
    const turnstileOk = await verifyTurnstile(turnstileToken);
    const recaptchaOk = await verifyRecaptcha(recaptchaToken);

    if (!turnstileOk && !recaptchaOk) {
      return res.status(400).json({ error: "Captcha verification failed" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");

    const user = new User({ name, email, password: hashed, emailVerifyToken });
    await user.save();

    // send verification email
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: "Verify your account",
      html: `<p>Please verify your email by clicking <a href="${verifyLink}">here</a></p>`
    });

    res.json({ success: true, message: "Registered. Check email to verify." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid request" });
    if (user.emailVerified) return res.json({ success: true, message: "Already verified" });
    if (user.emailVerifyToken !== token) return res.status(400).json({ error: "Invalid token" });
    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, turnstileToken, recaptchaToken } = req.body;

    // verify captcha(s) — optional here but recommended for login too
    const turnstileOk = await verifyTurnstile(turnstileToken);
    const recaptchaOk = await verifyRecaptcha(recaptchaToken);
    if (!turnstileOk && !recaptchaOk) {
      return res.status(400).json({ error: "Captcha verification failed" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    if (user.isLocked()) {
      return res.status(403).json({ error: "Account locked. Try later." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      await user.save();
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // require email verification for login (optional)
    if (!user.emailVerified) {
      await user.save();
      return res.status(403).json({ error: "Email not verified" });
    }

    // issue tokens
    const payload = { id: user._id, email: user.email, roles: user.roles };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user._id });

    // store refresh token (simple storage — for production, store hashed)
    user.refreshTokens = [...user.refreshTokens, refreshToken];
    await user.save();

    // send tokens (access in body, refresh as httpOnly cookie)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    return res.json({ accessToken, user: { email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) return res.status(401).json({ error: "No token" });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.id);
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const newAccess = signAccessToken({ id: user._id, email: user.email, roles: user.roles });
    return res.json({ accessToken: newAccess });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token && req.user) {
      // remove refresh token from user
      const user = await User.findById(req.user.id);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(t => t !== token);
        await user.save();
      }
    }
    res.clearCookie("refreshToken");
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true }); // avoid user enumeration

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendEmail({ to: email, subject: "Password reset", html: `<p>Reset: <a href="${resetLink}">link</a></p>` });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    const user = await User.findOne({ email, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
