import React, { useState } from "react";
import axios from "axios";
const API = "http://localhost:5000/api";

export default function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/auth/verify-email`, { email, token });
      setMsg(data.message || "Email verified!");
    } catch (err) {
      setMsg(err.response?.data?.error || "Verification failed");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Verify Email</h2>
      <form onSubmit={handleVerify} className="space-y-2">
        <input className="border w-full p-2" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border w-full p-2" placeholder="Verification Token"
          value={token} onChange={e=>setToken(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-2">Verify</button>
      </form>
      <p className="mt-2">{msg}</p>
    </div>
  );
}
