"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("userInfo", JSON.stringify(data));
        if (data.role === "lawyer" || data.role === "admin") {
          router.push("/dashboard");
        } else {
          router.push("/client/dashboard");
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/users/google", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: tokenResponse.access_token, role }),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("userInfo", JSON.stringify(data));
          if (data.role === "lawyer" || data.role === "admin") {
            router.push("/dashboard");
          } else {
            router.push("/client/dashboard");
          }
        } else {
          setError(data.message || "Google Login failed");
          setLoading(false);
        }
      } catch (err) {
        setError("An error occurred during Google Login.");
        setLoading(false);
      }
    },
    onError: () => setError("Google Login Failed")
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -left-[5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[5%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="relative w-full max-w-[440px] animate-slide-up">
          {/* Brand Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20 mb-4">
              <span className="material-symbols-outlined text-on-primary text-2xl">balance</span>
            </div>
            <h1 className="text-[30px] font-semibold text-on-surface tracking-tight">
              LexAgile AI
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Legal precision, financial agility.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 shadow-elevated">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-on-surface tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Access your legal workspace and cases.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm text-center">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="text-sm font-medium text-on-surface-variant block tracking-wide"
                >
                  Email address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    mail
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@lexagile.com"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/40
                      rounded-lg text-on-surface placeholder:text-outline/50
                      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-medium text-on-surface-variant tracking-wide"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs font-semibold text-primary hover:underline transition-all"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    lock
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-surface-container-low border border-outline-variant/40
                      rounded-lg text-on-surface placeholder:text-outline/50
                      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label htmlFor="login-role" className="text-sm font-medium text-on-surface-variant block tracking-wide">
                  Your Role
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">work</span>
                  <select id="login-role"
                    value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                    <option value="client">Client</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 bg-primary text-on-primary font-medium text-sm rounded-lg
                  shadow-primary hover:opacity-90 active:scale-[0.98] transition-all
                  flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? "Logging in..." : "Login"}
                {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-grow bg-outline-variant/40" />
              <span className="text-[10px] font-semibold text-outline uppercase tracking-[0.15em]">
                Or continue with
              </span>
              <div className="h-px flex-grow bg-outline-variant/40" />
            </div>

            {/* SSO */}
            <button
              id="login-sso"
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-6 bg-surface-container-lowest border border-outline-variant/40
                text-on-surface-variant font-medium text-sm rounded-lg
                hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Single Sign-On
            </button>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Don&apos;t have an account yet?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline ml-1">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs font-semibold text-outline hover:text-on-surface-variant transition-colors">
            Security Standards
          </a>
          <a href="#" className="text-xs font-semibold text-outline hover:text-on-surface-variant transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-xs font-semibold text-outline hover:text-on-surface-variant transition-colors">
            Terms of Service
          </a>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-outline filled">verified_user</span>
          <span className="text-xs font-semibold text-outline">End-to-end Encrypted Session</span>
        </div>
      </footer>
    </div>
  );
}
