import React, { useState } from "react";
import axios from "axios";
const API = "http://localhost:5000/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem("accessToken", data.accessToken);
      setMsg("Login success! Token saved to localStorage.");
    } catch (err) {
      setMsg(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Login</h2>
      <form onSubmit={handleLogin} className="space-y-2">
        <input className="border w-full p-2" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border w-full p-2" placeholder="Password" type="password"
          value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-2">Login</button>
      </form>
      <p className="mt-2">{msg}</p>
    </div>
  );
}
