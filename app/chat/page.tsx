


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
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Messages</h1>
        <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
          {chats.length} active threads
        </div>
      </div>

      <div className="grid gap-4">
        {chats.length === 0 ? (
          <div className="glass-card py-20 text-center opacity-30 flex flex-col items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-bold tracking-[0.2em] uppercase text-sm">No conversations found</p>
          </div>
        ) : (
          chats.map((c) => {
            const last = c.messages?.[0]
            const subtitle = last ? last.content : 'No messages yet'
            const time = last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
            const fallback = c.members.map(m => m.user.name || m.user.email).join(', ')
            const title = c.name || fallback || 'Chat'
            return (
              <Link key={c.id} href={`/chat/${c.id}`} className="glass-card group hover:border-primary/40 transition-all duration-300">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-primary/5">
                    {title.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate pr-4">{title}</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">{time}</span>
                    </div>
                    <p className="text-white/40 text-sm font-medium truncate italic">
                      {subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      <div className="glass-card border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 rounded-full" />

        <h2 className="text-xl font-bold mb-10 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full"></span>
          Start New Dialogue
        </h2>

        <div className="space-y-10 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Thread Subject (Optional)</label>
            <input
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="glass-input w-full h-12"
              placeholder="e.g. Weekend Expedition planning"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Invite Participants</label>
            <div className="flex flex-wrap gap-3">
              {buddies.length === 0 ? (
                <p className="text-xs text-white/20 font-bold uppercase tracking-[0.2em] py-4">Seek buddies to start chatting</p>
              ) : (
                buddies.map((b) => {
                  const active = selected.includes(b.id)
                  return (
                    <button
                      key={b.id}
                      onClick={() =>
                        setSelected((prev) => (prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id]))
                      }
                      className={`px-6 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${active
                        ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white translate-y-[-2px]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {b.name || b.email}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={createChat}
              disabled={loading || selected.length === 0}
              className="glass-button bg-white text-black border-transparent w-full h-14 text-base font-black shadow-xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Initializing Thread...
                </div>
              ) : 'Establish Connection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

