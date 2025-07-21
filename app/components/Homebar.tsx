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
    href: "/messages",
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
      <div className="h-screen flex flex-col justify-between bg-card text-main">
        {session.status === "authenticated" ? (
          <div className="p-4 flex flex-col h-full">
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="cursor-pointer"
            >
              <div className="avatar overflow-hidden border-2 border-accent mx-auto shadow-sm bg-accent/20">
                <Image
                  src={session?.data.user?.image}
                  alt="Profile"
                  width={36}
                  height={36}
                  className="object-cover"
                />
              </div>
              <div className="font-medium mt-2 text-center heading-3 text-sm">
                {session.data.user?.name}
              </div>
              <div className="text-gray-500 text-center body-sm text-xs">
                {"@" + session.data.user?.username}
              </div>
            </div>
            {/* Profile Modal */}
            {isProfileModalOpen && (
              <div
                className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50"
                onClick={() => setIsProfileModalOpen(false)}
              >
                <div
                  className="relative w-full max-w-lg h-auto bg-card p-4 rounded-lg shadow-xl border"
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
                    className="absolute top-0 right-0 m-6"
                    onClick={() => setIsProfileModalOpen(false)}
                  >
                    <Icons.FaTimes className="text-2xl text-red-500" />
                  </button>
                  <div className="mt-16 p-4 text-center">
                    <div className="heading-2 text-base">
                      {session?.data.user.name}
                    </div>
                    <div className="text-gray-500 body-sm text-xs">
                      {"@" + session?.data.user.username}
                    </div>
                    <div className="mt-2 body-lg text-sm">{bio}</div>
                    <div className="mt-2 flex justify-center space-x-4 text-xs">
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
            <div className="flex flex-col gap-1 mt-6">
              {Object.values(homeBarContents).map((item) => {
                const IconComponent = Icons[item.icon as keyof typeof Icons];
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.label}
                    className={`flex items-center gap-2 px-compact py-compact rounded-md text-sm transition-all font-medium shadow-sm
                      ${
                        isActive
                          ? "bg-accent text-white"
                          : "hover:bg-accent/10 text-blue-900"
                      }
                    `}
                    onClick={() => router.push(item.href)}
                  >
                    <IconComponent
                      className={`icon ${
                        isActive ? "text-white" : "text-accent"
                      }`}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="flex-1" />
            {/* Floating Action Button for mobile */}
            <button
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-accent text-white rounded-full shadow-lg p-4 flex items-center justify-center md:hidden hover:bg-accent-hover transition-all"
              style={{ boxShadow: "0 4px 16px 0 rgba(37,99,235,0.15)" }}
              onClick={() => router.push("/")}
              aria-label="Create New Poll"
            >
              <Icons.FaPlus className="text-2xl" />
            </button>
            <button className="mt-6 button w-full" onClick={() => signOut()}>
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
    </>
  );
};

export default Homebar;
