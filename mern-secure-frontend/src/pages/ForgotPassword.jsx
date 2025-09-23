import React, { useState } from "react";
import axios from "axios";
const API = "http://localhost:5000/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { email });
      setMsg(data.message || "If that email exists, reset link sent.");
    } catch (err) {
      setMsg(err.response?.data?.error || "Request failed");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Forgot Password</h2>
      <form onSubmit={handleForgot} className="space-y-2">
        <input className="border w-full p-2" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-2">Send Reset Link</button>
      </form>
      <p className="mt-2">{msg}</p>
    </div>
  );
}
