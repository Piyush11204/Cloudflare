import React, { useState } from "react";
import axios from "axios";
const API = "http://localhost:5000/api";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/auth/reset-password`, { email, token, newPassword });
      setMsg(data.message || "Password reset successful");
    } catch (err) {
      setMsg(err.response?.data?.error || "Reset failed");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Reset Password</h2>
      <form onSubmit={handleReset} className="space-y-2">
        <input className="border w-full p-2" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border w-full p-2" placeholder="Reset Token"
          value={token} onChange={e=>setToken(e.target.value)} />
        <input className="border w-full p-2" placeholder="New Password" type="password"
          value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
        <button className="bg-green-500 text-white px-4 py-2">Reset</button>
      </form>
      <p className="mt-2">{msg}</p>
    </div>
  );
}
