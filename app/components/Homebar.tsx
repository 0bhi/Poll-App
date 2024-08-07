"use client";
import React, { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Homebar = () => {
  const session: any = useSession();
  const router = useRouter();
  return (
    <>
      <div>
        <div>
          {session.status === "authenticated" ? (
            <div className="m-4">
              <div className="bg-blue-300 rounded-full h-16 w-16 "></div>
              <div className="font-bold mt-4">{session.data.user?.name}</div>
              <div className="text-gray-500">
                {"@" + session.data.user?.username}
              </div>
              <button
                className="fixed bottom-0 bg-blue-700 rounded-full mb-2 p-3 text-white font-semibold"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div>
              <button
                className="bg-blue-700 rounded-full mb-2 p-3 text-white font-semibold m-2"
                onClick={() => {
                  signIn();
                }}
              >
                Sign in
              </button>
              <button
                className="bg-blue-700 rounded-full mb-2 p-3 text-white font-semibold m-2"
                onClick={() => router.push("/signup")}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Homebar;
