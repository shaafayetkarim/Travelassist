"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, MapPin, Users, Hotel, UserCheck, User, LogOut, MessageCircleHeart, } from "lucide-react"

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

  const baseNavItems = [
    { name: "Discovery", href: "/discovery", icon: MapPin },
    { name: "Trip", href: "/trip", icon: MapPin },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "Hotel", href: "/hotel", icon: Hotel },
    { name: "Buddies", href: "/buddies", icon: UserCheck },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Textbud", href: "/chat", icon: MessageCircleHeart },
  ]

  // Add Community for premium users
  const navItems = user?.isPremium === true
    ? [
        baseNavItems[0], // Discovery
        baseNavItems[1], // Trip
        { name: "Community", href: "/community", icon: Users }, // Community for premium
        ...baseNavItems.slice(2), // Rest of the items
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

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/discovery" className="text-2xl font-bold text-primary-600">
              Travel Buddy
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
