
// Utility function to get auth headers
import { NextResponse } from 'next/server';

const response = NextResponse.json({});
response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Set expiration to past date to delete cookie
      path: '/',
      sameSite: 'lax'
    });

export function getAuthHeaders() {
  const token = localStorage.getItem("auth-token")
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      }
}

// Utility function to make authenticated API calls
export async function apiCall(url: string, options: RequestInit = {}) {
  const headers = getAuthHeaders()

  const response = await fetch(url, {
    ...options,
    headers: new Headers({
      ...headers,
      ...(options.headers as Record<string, string>),
    }),
  })

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user")
    window.location.href = "/"
    return
  }

  return response
}
