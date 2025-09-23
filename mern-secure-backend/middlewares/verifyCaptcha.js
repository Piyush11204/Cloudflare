import axios from "axios";

export const verifyTurnstile = async (token) => {
  if (!token) return false;
  try {
    const params = new URLSearchParams();
    params.append("secret", process.env.TURNSTILE_SECRET);
    params.append("response", token);
    const res = await axios.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", params);
    return res.data && res.data.success === true;
  } catch (err) {
    console.error("Turnstile verify error:", err.message || err);
    return false;
  }
};

export const verifyRecaptcha = async (token) => {
  if (!token) return false;
  try {
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    const res = await axios.post("https://www.google.com/recaptcha/api/siteverify", params);
    // for v3 you may check score > 0.5 etc.
    return res.data && (res.data.success === true);
  } catch (err) {
    console.error("reCAPTCHA verify error:", err.message || err);
    return false;
  }
};
