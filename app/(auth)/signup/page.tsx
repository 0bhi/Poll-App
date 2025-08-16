"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const Signup = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async () => {
    try {
      let res = await axios.post("/api/signup", {
        name: name,
        username: username,
        email: email,
        password: password,
      });
      console.log(res);
      if (res) {
        const signInResponse = await signIn("credentials", {
          email: email,
          password: password,
          redirect: false,
        });
        if (signInResponse) {
          router.push("/");
        } else {
          console.log("Sign-in error:", signInResponse);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm md:max-w-md p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col gap-4 md:gap-6">
        <h1 className="text-2xl md:text-3xl mb-4 font-bold text-center text-gray-800">
          Sign Up
        </h1>

        <div className="space-y-3 md:space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            className="w-full border-2 p-3 md:p-4 focus:outline-none rounded-xl border-gray-300 focus:border-blue-500 transition-colors text-base"
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            className="w-full border-2 p-3 md:p-4 focus:outline-none rounded-xl border-gray-300 focus:border-blue-500 transition-colors text-base"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            className="w-full border-2 p-3 md:p-4 focus:outline-none rounded-xl border-gray-300 focus:border-blue-500 transition-colors text-base"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            className="w-full border-2 p-3 md:p-4 focus:outline-none rounded-xl border-gray-300 focus:border-blue-500 transition-colors text-base"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-3 md:p-4 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
        >
          Sign Up
        </button>

        <div className="flex items-center my-2 md:my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm md:text-base">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white p-3 md:p-4 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors shadow-md"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          <span className="text-gray-700 font-medium">
            Continue with Google
          </span>
        </button>

        <div className="text-center text-gray-600 text-sm md:text-base">
          Already have an Account?{" "}
          <button
            className="hover:underline text-blue-600 font-semibold transition-colors"
            onClick={() => signIn()}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
