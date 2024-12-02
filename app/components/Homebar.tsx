"use client";
import React, { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

  return (
    <>
      <div>
        <div>
          {session.status === "authenticated" ? (
            <div className="m-4">
              <div onClick={() => setIsProfileModalOpen(true)}>
                <div className="bg-blue-300 rounded-full h-16 w-16 overflow-hidden">
                  <Image
                    src={session?.data.user?.image}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>

                <div className="font-bold mt-4">{session.data.user?.name}</div>
                <div className="text-gray-500">
                  {"@" + session.data.user?.username}
                </div>

                {isProfileModalOpen && (
                  <div
                    className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50"
                    onClick={() => setIsProfileModalOpen(false)}
                  >
                    <div
                      className="relative w-1/2 h-3/4 bg-white p-4 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative">
                        <div className="w-full h-48 bg-gray-300 rounded-t-lg">
                          {/* Add cover photo here */}
                        </div>

                        <div className="absolute -bottom-16 left-4">
                          <img
                            src={session.data.user?.image}
                            alt="Profile"
                            className="w-32 h-32 bg-blue-300 rounded-full border-4 border-white"
                          />
                        </div>
                      </div>
                      <button
                        className="absolute top-0 right-0 m-6"
                        onClick={() => setIsProfileModalOpen(false)}
                      >
                        <Icons.FaTimes className="text-2xl text-red-500" />
                      </button>

                      <div className="mt-16 p-4">
                        <div></div>
                        <div className="text-xl">{session?.data.user.name}</div>
                        <div className="text-gray-500">
                          {"@" + session?.data.user.username}
                        </div>
                        <div className="mt-4">{bio}</div>
                        <div className="mt-4 flex space-x-2">
                          <div className="font-bold">{followers}</div>
                          <div>Followers</div>
                          <div className="font-bold">{following}</div>
                          <div>Following</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-left justify-between mt-4 p-4L">
                {Object.values(homeBarContents).map((item) => {
                  const IconComponent = Icons[item.icon as keyof typeof Icons];
                  return (
                    <button
                      key={item.label}
                      className="flex items-center p-2 text-xl"
                      onClick={() => router.push(item.href)}
                    >
                      <IconComponent className="pr-2 text-3xl text-blue-700" />
                      {item.label}
                    </button>
                  );
                })}
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
