"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [userName, setUserName] = useState("User");
  const router = useRouter();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (userInfo?.name) {
      setUserName(userInfo.name);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/users/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header
      id="top-bar"
      className="sticky top-0 z-40 flex justify-between items-center px-6 lg:px-8 h-16 w-full
        glass-header border-b border-outline-variant/20 shadow-card"
    >
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div
          className={`relative w-full transition-all duration-200 ${
            searchFocused ? "max-w-xl" : "max-w-md"
          }`}
        >
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            id="global-search"
            type="text"
            placeholder="Search cases, documents, or clients..."
            className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border border-transparent rounded-full
              text-sm text-on-surface placeholder:text-outline/60
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30
              focus:bg-surface-container-lowest transition-all duration-200"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          id="topbar-notifications"
          className="relative p-2.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-lowest" />
        </Link>

        <button
          id="topbar-help"
          className="p-2.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">help_outline</span>
        </button>

        <div className="hidden sm:block h-6 w-px bg-outline-variant/40 mx-1" />

        <Link
          href="/settings"
          id="topbar-profile"
          className="flex items-center gap-3 p-1.5 pr-3 rounded-full
            hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold uppercase">
            {userName.substring(0, 2)}
          </div>
          <span className="text-sm font-semibold text-on-surface hidden lg:block">
            {userName}
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="p-2.5 text-error hover:bg-error/10 rounded-full transition-colors flex items-center"
          title="Logout"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
        </button>
      </div>
    </header>
  );
}
