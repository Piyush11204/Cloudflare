import React, { useState, useEffect } from "react";
import axios from "axios";
const API = "http://localhost:5000/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMsg("No token found. Please login.");
      return;
    }
    axios.get(`${API}/user/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setUser(res.data.user))
    .catch(err => setMsg(err.response?.data?.error || "Failed to fetch profile"));
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Profile</h2>
      {user ? (
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      ) : (
        <p>{msg}</p>
      )}
    </div>
  );
}
