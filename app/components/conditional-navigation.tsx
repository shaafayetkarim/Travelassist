"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "./navigation"

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription: string;
}

export default function ConditionalNavigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData) as User
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
        localStorage.removeItem("user") // Clear invalid data
      }
    }
  }, [])

  // Hide navigation for auth pages, admin pages, and root page (signin)
  const hideNavigation = pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/admin")

  if (hideNavigation) {
    return null
  }

  return <Navigation user={user} />
}
