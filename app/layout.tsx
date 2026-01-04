import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import ConditionalNavigation from "./components/conditional-navigation"
import { NotificationProvider } from "@/lib/notification-context"

const outfit = Outfit({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Travel Buddy",
  description: "Your travel companion app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} bg-[#0a0a0c] text-slate-50 min-h-screen overflow-x-hidden`}>
        <NotificationProvider>
          <ConditionalNavigation />
          <main className="min-h-screen pt-32">{children}</main>
        </NotificationProvider>
      </body>
    </html>
  )
}

