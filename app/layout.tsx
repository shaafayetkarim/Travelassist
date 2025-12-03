import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ConditionalNavigation from "./components/conditional-navigation"

const inter = Inter({ subsets: ["latin"] })

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
    <html lang="en">
      <body className={inter.className}>
        <ConditionalNavigation />
        <main className="min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  )
}
