import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");

  // Common state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup‑only state
  const [confirmPassword, setConfirmPassword] = useState("");

  // Feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Helpers
  const resetFeedback = () => {
    setError("");
    setSuccess("");
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    resetFeedback();
    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Login failed");
      localStorage.setItem("jwt", body.token);
      setSuccess("Logged in successfully!");
      setTimeout(() => navigate("/todos"), 500);
    } catch (err) {
      setError(err.message);
    }
  };

  // Signup handler
  const handleSignup = async (e) => {
    e.preventDefault();
    resetFeedback();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, verified: false }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Signup failed");
      setSuccess("Account created successfully! Login to the App.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="h-full">
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            Welcome
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 sm:shadow sm:rounded-lg sm:px-10 sm:border sm:border-gray-200">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => {
                  setActiveTab("login");
                  resetFeedback();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                  activeTab === "login"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setActiveTab("register");
                  resetFeedback();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                  activeTab === "register"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Feedback */}
            {(error || success) && (
              <p
                className={`mt-4 text-center ${
                  error ? "text-red-500" : "text-green-600"
                }`}
              >
                {error || success}
              </p>
            )}

            {/* Login Form */}
            {activeTab === "login" && (
              <form
                className="space-y-6 pt-6"
                onSubmit={handleLogin}
                noValidate
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800"
                >
                  Sign in
                </button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === "register" && (
              <form
                className="space-y-6 pt-6"
                onSubmit={handleSignup}
                noValidate
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800"
                >
                  Create account
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
