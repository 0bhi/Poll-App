"use client";
import React, { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import * as Icons from "react-icons/fa";

import Image from "next/image";

const homeBarContents = {
  home: {
    icon: "FaHome",
    label: "Home",
    href: "/",
  },
  search: {
    icon: "FaSearch",
    label: "Search",
    href: "/search",
  },
  messages: {
    icon: "FaEnvelope",
    label: "Messages",
    href: "/messages",
  },
  settings: {
    icon: "FaCog",
    label: "Settings",
    href: "/settings",
  },
};

const Homebar = () => {
  const session: any = useSession();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <div className="relative h-screen flex flex-col justify-between bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        {session.status === "authenticated" ? (
          <div className="p-4 md:p-6 flex flex-col h-full overflow-y-auto pb-24">
            <div
              onClick={() =>
                router.push(`/${session?.data?.user?.username ?? ""}`)
              }
              className="cursor-pointer group"
            >
              <div className="avatar overflow-hidden border-2 border-accent mx-auto shadow-lg bg-accent/20 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Image
                  src={session?.data.user?.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div className="font-semibold mt-3 text-center heading-3 text-sm md:text-base group-hover:text-blue-400 transition-colors">
                {session.data.user?.name}
              </div>
              <div className="text-gray-400 text-center body-sm text-xs md:text-sm group-hover:text-gray-300 transition-colors">
                {"@" + session.data.user?.username}
              </div>
            </div>
            {/* Navigation */}
            <div className="flex flex-col gap-2 mt-6 md:mt-8">
              {Object.values(homeBarContents).map((item) => {
                const IconComponent = Icons[item.icon as keyof typeof Icons];
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.label}
                    className={`flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-base md:text-lg transition-all duration-300 font-medium shadow-sm group
                       ${
                         isActive
                           ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105"
                           : "text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md"
                       }
                     `}
                    onClick={() => router.push(item.href)}
                  >
                    <IconComponent
                      className={`icon transition-all duration-300 text-lg md:text-xl ${
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-blue-400"
                      }`}
                    />
                    <span className="font-semibold text-sm md:text-base">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex-1" />
            {/* Floating action for mobile: sign out */}
            <div className="md:hidden mt-6 sticky bottom-4 flex justify-end z-10">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                onClick={() => signOut()}
                aria-label="Sign out"
              >
                <Icons.FaSignOutAlt className="text-lg" />
                <span className="text-sm font-semibold">Sign out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <button
              className="bg-blue-700 rounded-full mb-2 p-2 md:p-3 text-white font-semibold m-2 text-sm md:text-base w-full md:w-auto"
              onClick={() => {
                signIn();
              }}
            >
              Sign in
            </button>
            <button
              className="bg-blue-700 rounded-full mb-2 p-2 md:p-3 text-white font-semibold m-2 text-sm md:text-base w-full md:w-auto"
              onClick={() => router.push("/signup")}
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Homebar;
