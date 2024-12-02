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
    <div className="items-center justify-center flex h-screen bg-blue-700">
      <div className="bg-blue-300 w-80 p-8 rounded-md flex flex-col gap-3 border-black-400">
        <h1 className="text-3xl mb-4 font-bold text-center text-blue-600">
          Sign Up
        </h1>
        <input
          type="text"
          placeholder="Name"
          value={name}
          className="border-2 p-2 focus:outline-none rounded-full border-blue-400"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          className="border-2 p-2 focus:outline-none rounded-full border-blue-400"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="Email"
          value={email}
          className="border-2 p-2 focus:outline-none rounded-full border-blue-400"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          className="border-2 p-2 focus:outline-none rounded-full border-blue-400"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-700 p-2 rounded-full font-bold text-white"
        >
          Sign Up
        </button>

        <div className="flex items-center my-2">
          <div className="flex-1 border-t border-gray-400"></div>
          <span className="px-3 text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-400"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-2 bg-white p-2 rounded-full border border-gray-300 hover:bg-gray-50"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Continue with Google</span>
        </button>

        <div className="text-center text-gray-500">
          Already have an Account?{" "}
          <button
            className="hover:underline text-blue-700"
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
