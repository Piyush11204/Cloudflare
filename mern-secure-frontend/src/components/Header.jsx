import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="p-4 bg-gray-800 text-white flex justify-between">
      <h1 className="font-bold">Secure MERN</h1>
      <nav className="space-x-4">
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/profile">Profile</Link>
      </nav>
    </header>
  );
}
