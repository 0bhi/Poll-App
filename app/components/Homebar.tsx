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
  notifications: {
    icon: "FaBell",
    label: "Notifications",
    href: "/notifications",
  },
  messages: {
    icon: "FaEnvelope",
    label: "Messages",
    href: "/chat",
  },
  settings: {
    icon: "FaCog",
    label: "Settings",
    href: "/settings",
  },
};

const Homebar = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [bio, setBio] = useState("");
  const session: any = useSession();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <div className="h-screen flex flex-col justify-between bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        {session.status === "authenticated" ? (
          <div className="p-4 md:p-6 flex flex-col h-full">
            <div
              onClick={() => setIsProfileModalOpen(true)}
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
            {/* Profile Modal */}
            {isProfileModalOpen && (
              <div
                className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                onClick={() => setIsProfileModalOpen(false)}
              >
                <div
                  className="relative w-full max-w-lg h-auto bg-card p-4 md:p-6 rounded-lg shadow-xl border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    <div className="w-full h-20 bg-accent/20 rounded-md flex items-center justify-center">
                      <span className="text-accent font-medium text-base">
                        Profile Cover
                      </span>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <img
                        src={session.data.user?.image}
                        alt="Profile"
                        className="avatar border-2 border-white shadow-sm object-cover"
                      />
                    </div>
                  </div>
                  <button
                    className="absolute top-2 right-2 md:top-6 md:right-6 m-2 md:m-6"
                    onClick={() => setIsProfileModalOpen(false)}
                  >
                    <Icons.FaTimes className="text-xl md:text-2xl text-red-500" />
                  </button>
                  <div className="mt-16 p-4 text-center">
                    <div className="heading-2 text-base md:text-lg">
                      {session?.data.user.name}
                    </div>
                    <div className="text-gray-500 body-sm text-xs md:text-sm">
                      {"@" + session?.data.user.username}
                    </div>
                    <div className="mt-2 body-lg text-sm md:text-base">
                      {bio}
                    </div>
                    <div className="mt-2 flex justify-center space-x-4 text-xs md:text-sm">
                      <div className="font-bold">{followers}</div>
                      <div>Followers</div>
                      <div className="font-bold">{following}</div>
                      <div>Following</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            {/* Floating Action Button for mobile */}
            <button
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-accent text-white rounded-full shadow-lg p-3 md:p-4 flex items-center justify-center md:hidden hover:bg-accent-hover transition-all"
              style={{ boxShadow: "0 4px 16px 0 rgba(37,99,235,0.15)" }}
              onClick={() => router.push("/")}
              aria-label="Create New Poll"
            >
              <Icons.FaPlus className="text-xl md:text-2xl" />
            </button>
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
