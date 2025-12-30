


'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiCall } from '@/lib/api'

type User = { id: string; name?: string | null; email?: string | null }

type Chat = {
  id: string
  name?: string | null
  isGroup: boolean
  members: { user: User }[]
  messages: { content: string; createdAt: string }[]
}

type Buddy = User

export default function ChatHomePage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [chatName, setChatName] = useState('')
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    const res = await apiCall('/api/chats', { method: 'GET' })
    if (res && res.ok) {
      const data = await res.json()
      setChats(data.chats || [])
    }
  }

  useEffect(() => {
    refresh()
    apiCall('/api/chat-buddies', { method: 'GET' })
      .then(r => r && r.ok ? r.json() : null)
      .then(d => setBuddies(d?.buddies || []))
    const iv = setInterval(refresh, 5000)
    return () => clearInterval(iv)
  }, [])

  const createChat = async () => {
    if (selected.length === 0) return
    setLoading(true)
    try {
      const r = await apiCall('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ memberIds: selected, name: chatName || undefined })
      })
      if (!r) return
      const d = await r.json()
      if (r.ok && d.chatId) {
        window.location.href = `/chat/${d.chatId}`
      } else {
        alert(d.error || 'Failed to create chat')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-semibold">Chats</h1>
      <div className="space-y-3">
        {chats.length === 0 && <p className="text-sm text-gray-500">No chats yet. Create one below.</p>}
        {chats.map((c) => {
          const last = c.messages?.[0]
          const subtitle = last ? `${new Date(last.createdAt).toLocaleString()} — ${last.content}` : 'No messages yet'
          const fallback = c.members.map(m => m.user.name || m.user.email).join(', ')
          const title = c.name || fallback || 'Chat'
          return (
            <Link key={c.id} href={`/chat/${c.id}`} className="block border rounded-lg p-3 hover:bg-gray-50">
              <div className="font-medium">{title}</div>
              <div className="text-xs text-gray-500 truncate">{subtitle}</div>
            </Link>
          )
        })}
      </div>
      <hr />
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Start a new chat</h2>
        <div>
          <label className="block text-sm font-medium">Chat name (optional)</label>
          <input
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            className="mt-1 w-full border rounded-md px-3 py-2"
            placeholder="Project A"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Select buddies</label>
          <div className="flex flex-wrap gap-2">
            {buddies.map((b) => {
              const active = selected.includes(b.id)
              return (
                <button
                  key={b.id}
                  onClick={() =>
                    setSelected((prev) => (prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id]))
                  }
                  className={`text-sm border rounded-full px-3 py-1 ${active ? 'bg-black text-white' : 'bg-white'}`}
                >
                  {b.name || b.email}
                </button>
              )
            })}
          </div>
        </div>
        <button
          onClick={createChat}
          disabled={loading || selected.length === 0}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create chat'}
        </button>
      </div>
    </div>
  )
}
