import React, { useState } from "react";
import axios from "axios";
const API = "http://localhost:5000/api";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
      setMsg(data.message || "Signup successful! Check email for verification.");
    } catch (err) {
      setMsg(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Signup</h2>
      <form onSubmit={handleSignup} className="space-y-2">
        <input className="border w-full p-2" placeholder="Name"
          value={name} onChange={e=>setName(e.target.value)} />
        <input className="border w-full p-2" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border w-full p-2" placeholder="Password" type="password"
          value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="bg-green-500 text-white px-4 py-2">Signup</button>
      </form>
      <p className="mt-2">{msg}</p>
    </div>
  );
}
