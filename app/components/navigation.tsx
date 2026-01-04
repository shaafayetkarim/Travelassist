"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Heart, MapPin, Users, Hotel, UserCheck, User, LogOut,
  Bell, Menu, X, Rocket
} from "lucide-react"
import { useNotifications } from "@/lib/notification-context"

interface NavigationProps {
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    isPremium: boolean;
  } | null;
}

export default function Navigation({ user }: NavigationProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { unreadCount, notifications, markAllAsRead, clearNotifications } = useNotifications()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const baseNavItems = [
    { name: "Discovery", href: "/discovery", icon: MapPin },
    { name: "Trip", href: "/trip", icon: MapPin },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "Hotel", href: "/hotel", icon: Hotel },
    { name: "Buddies", href: "/buddies", icon: UserCheck },
    { name: "Profile", href: "/profile", icon: User },
  ]

  const navItems = user?.isPremium === true
    ? [
      baseNavItems[0],
      baseNavItems[1],
      { name: "Community", href: "/community", icon: Users },
      ...baseNavItems.slice(2),
    ]
    : baseNavItems

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("auth-token")
      localStorage.removeItem("user")
      window.location.href = "/"
    }
  }

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen)
    if (!isNotificationOpen && unreadCount > 0) {
      setTimeout(() => markAllAsRead(), 2000)
    }
  }

  return (
    <nav className={`fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-7xl z-50 transition-all duration-700 rounded-3xl ${isScrolled
      ? "bg-black/40 backdrop-blur-2xl border border-white/5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] scale-[0.98] py-2"
      : "bg-transparent py-4"
      }`}>
      <div className="mx-auto px-8 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/discovery" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center group-hover:rotate-[10deg] transition-all duration-500 shadow-xl shadow-primary/20 border border-white/10">
            <Rocket className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight leading-none group-hover:text-primary transition-colors">TRAVELBUDDY</span>
            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-0.5">Ventures</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${isActive
                  ? "text-white"
                  : "text-white/40 hover:text-white"
                  }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 rounded-xl border border-white/10 shadow-lg" />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? "text-primary animate-pulse" : "opacity-50"}`} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 relative group border ${isNotificationOpen ? "bg-primary border-primary/20" : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
            >
              <Bell className={`w-4 h-4 transition-colors ${isNotificationOpen ? "text-white" : "text-white/40 group-hover:text-white"}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-[#0a0a0c]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute top-14 right-0 w-80 glass rounded-3xl overflow-hidden shadow-2xl border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-md">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Signals</h3>
                  <button onClick={clearNotifications} className="text-[8px] font-black text-primary hover:brightness-125 transition-all uppercase tracking-widest">Protocol Clear</button>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center gap-4 opacity-20">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Transmissions</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-5 group hover:bg-white/5 transition-all border-b border-white/[0.02] ${!n.read ? "bg-primary/5" : ""}`}>
                        <div className="flex gap-4">
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${!n.read ? "bg-primary animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "bg-white/10"}`} />
                          <div>
                            <p className="text-[11px] leading-relaxed text-white/70 font-bold group-hover:text-white transition-colors">{n.message}</p>
                            <span className="text-[9px] font-black text-white/20 mt-3 block uppercase tracking-widest">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 group transition-all duration-500"
          >
            <LogOut className="w-4 h-4 text-white/20 group-hover:text-red-400 transition-colors" />
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden mt-4 p-4 flex flex-col gap-2 animate-in slide-in-from-top-4 duration-500 bg-black/80 backdrop-blur-2xl rounded-b-3xl border-t border-white/5 shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isActive
                  ? "bg-primary text-white shadow-xl shadow-primary/20"
                  : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "opacity-40"}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}

