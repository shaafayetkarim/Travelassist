"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Mail, Lock, AlertCircle, Rocket, Sparkles } from "lucide-react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Label } from "@/components/label"

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid credentials")
        setIsLoading(false)
        return
      }

      localStorage.setItem("auth-token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      if (data.user.type === "ADMIN") {
        window.location.href = "/admin/dashboard"
      } else {
        window.location.href = "/discovery"
      }
    } catch (error) {
      setError("Network error. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full animate-glow" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-6 rotate-3">
            <Rocket className="text-white w-8 h-8" />
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">Welcome Back</h2>
          <p className="text-white/40 text-sm font-medium">
            New here?{" "}
            <Link href="/auth/signup" className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>

        <div className="glass-card !p-8 border-white/10 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-xs text-red-200 font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="glass-input w-full pl-12 h-14"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="glass-input w-full pl-12 h-14"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium mt-12">
          &copy; 2026 TravelBuddy Ecosystem
        </p>
      </div>
    </div>
  )
}

