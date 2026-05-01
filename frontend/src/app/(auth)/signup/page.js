"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from '@react-oauth/google';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("client");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (!agreeTerms) {
      return setError("You must agree to the terms");
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userInfo", JSON.stringify(data));
        router.push("/dashboard");
      } else {
        setError(data.message || "Registration failed");
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userInfo", JSON.stringify(data));
          router.push("/dashboard");
        } else {
          setError(data.message || "Google Signup failed");
          setLoading(false);
        }
      } catch (err) {
        setError("An error occurred during Google Signup.");
        setLoading(false);
      }
    },
    onError: () => setError("Google Signup Failed")
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[1100px] bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-elevated overflow-hidden flex animate-slide-up">
        {/* Left Panel — Branding */}
        <div className="hidden lg:flex flex-col justify-between w-[42%] bg-primary p-10 text-on-primary relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2.5 mb-10">
              <span className="material-symbols-outlined text-[28px]">account_balance</span>
              <span className="text-2xl font-bold tracking-tight">LexAgile AI</span>
            </div>
            <h2 className="text-[28px] font-semibold leading-snug tracking-tight">
              Elevate your legal workflow with precision.
            </h2>
            <p className="text-on-primary/70 mt-4 text-sm leading-relaxed">
              Join thousands of legal professionals leveraging AI to streamline discovery,
              automate contracts, and manage high-stakes litigation.
            </p>
          </div>

          {/* Decorative illustration area */}
          <div className="mt-8 rounded-xl overflow-hidden border border-white/10 shadow-xl">
            <div className="bg-white/5 backdrop-blur-sm p-6 h-48 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-[48px] text-on-primary/40">insights</span>
                <p className="text-xs text-on-primary/40 mt-2">AI-Powered Legal Analytics</p>
              </div>
            </div>
          </div>

          {/* Background orbs */}
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-white/5 blur-[60px]" />
          <div className="absolute top-20 -right-20 w-[200px] h-[200px] rounded-full bg-white/5 blur-[40px]" />
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-12 overflow-y-auto max-h-[90vh] min-w-[320px]">
          <div className="w-full max-w-[440px] mx-auto">
            <h1 className="text-[28px] font-semibold text-on-surface tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Start your 14-day free trial. No credit card required.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSignup}>
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm text-center">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="signup-name" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">person</span>
                  <input id="signup-name" type="text" placeholder="John Doe"
                    value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>

              {/* Work Email */}
              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Work Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                  <input id="signup-email" type="email" placeholder="john@lexagile.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label htmlFor="signup-role" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Your Role
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">work</span>
                  <select id="signup-role"
                    value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                    <option value="client">User</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="signup-password" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                    <input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="signup-confirm" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Confirm
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">shield</span>
                    <input id="signup-confirm" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} required
                  className="mt-0.5 w-4 h-4 text-primary rounded border-outline-variant/40 focus:ring-primary/20" />
                <span className="text-sm text-on-surface-variant">
                  I agree to the <a href="#" className="text-primary font-semibold hover:underline">Terms of Service</a> and{" "}
                  <a href="#" className="text-primary font-semibold hover:underline">Privacy Policy</a>.
                </span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className={`w-full py-3 px-6 bg-primary text-on-primary font-medium text-sm rounded-lg shadow-primary hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {loading ? "Creating Account..." : "Create Account"}
                {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-grow bg-outline-variant/40" />
              <span className="text-[10px] font-semibold text-outline uppercase tracking-[0.15em]">Or sign up with</span>
              <div className="h-px flex-grow bg-outline-variant/40" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="py-3 px-4 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button type="button" className="py-3 px-4 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00A4EF">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                </svg>
                Microsoft
              </button>
            </div>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-on-surface-variant">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="fixed bottom-4 right-4 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-full px-4 py-2 shadow-card">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse-soft" />
          <span className="text-xs font-medium text-on-surface-variant">System Status: Online</span>
        </div>
        <button className="w-10 h-10 bg-surface-container-lowest border border-outline-variant/30 rounded-full flex items-center justify-center shadow-card hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">help_outline</span>
        </button>
      </div>
    </div>
  );
}
