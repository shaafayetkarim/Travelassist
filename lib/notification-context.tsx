"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface Notification {
    id: string
    message: string
    timestamp: Date
    read: boolean
}

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    addNotification: (message: string) => void
    markAllAsRead: () => void
    clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("notifications")
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setNotifications(parsed.map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                })))
            } catch (e) {
                console.error("Failed to parse notifications", e)
            }
        }
    }, [])

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem("notifications", JSON.stringify(notifications))
    }, [notifications])

    const addNotification = (message: string) => {
        const newNotification: Notification = {
            id: Math.random().toString(36).substring(7),
            message,
            timestamp: new Date(),
            read: false,
        }
        setNotifications((prev) => [newNotification, ...prev])
    }

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }

    const clearNotifications = () => {
        setNotifications([])
    }

    const unreadCount = notifications.filter((n) => !n.read).length

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAllAsRead,
                clearNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider")
    }
    return context
}
