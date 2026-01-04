
'use client'

import { useEffect, useRef, useState } from 'react'
import { apiCall } from '@/lib/api'

type Msg = {
  id: string
  content: string
  createdAt: string
  sender: { id: string; name?: string | null }
}

export default function ChatRoomPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [lastTs, setLastTs] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const seenIds = useRef<Set<string>>(new Set())
  const polling = useRef<NodeJS.Timeout | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const newestTs = (arr: Msg[]) =>
    arr.length ? arr[arr.length - 1].createdAt : lastTs

  const load = async () => {
    const qs = lastTs ? `?after=${encodeURIComponent(lastTs)}` : ''
    const res = await apiCall(`/api/chats/${id}/messages${qs}`, { method: 'GET' })
    if (!res || !res.ok) return
    const data = await res.json()
    const incoming: Msg[] = Array.isArray(data.messages) ? data.messages : []
    if (incoming.length === 0) {
      if (!lastTs) setLastTs(data.now || new Date().toISOString())
      return
    }
    const fresh = incoming.filter(m => !seenIds.current.has(m.id))
    if (fresh.length === 0) return
    fresh.forEach(m => seenIds.current.add(m.id))
    setMessages(prev => [...prev, ...fresh])
    setLastTs(newestTs([...messages, ...fresh]) || data.now || new Date().toISOString())
  }

  useEffect(() => {
    // Fetch profile to get current user ID
    apiCall('/api/profile').then(r => r && r.ok ? r.json() : null).then(d => {
      if (d?.id) setCurrentUserId(d.id)
    })

    setMessages([])
    setLastTs(null)
    seenIds.current.clear()
    load()
    if (polling.current) clearInterval(polling.current)
    polling.current = setInterval(load, 3000)
    return () => {
      if (polling.current) clearInterval(polling.current)
    }
  }, [id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setText('')
    const r = await apiCall(`/api/chats/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: body }),
    })
    if (r && r.ok) {
      await load()
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-6 py-6 px-4">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto glass-card border-white/5 p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="font-bold tracking-[0.2em] uppercase text-xs text-center px-12">
              The resonance begins when you speak.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = currentUserId === m.sender?.id
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1.5`}>
                  <div className="flex items-center gap-2 px-1">
                    {!isMe && <span className="text-[10px] font-black tracking-widest uppercase text-primary/60">{m.sender?.name || 'Explorer'}</span>}
                    <span className="text-[10px] font-bold text-white/20">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-lg ${isMe
                      ? 'bg-primary text-white rounded-tr-none shadow-primary/10 border border-primary/20'
                      : 'bg-white/5 text-white/80 rounded-tl-none border border-white/10'
                    }`}>
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="glass-card p-2 border-white/10 flex gap-2 items-center">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="Type your message..."
          className="flex-1 glass-input h-12 px-6 border-none ring-0 focus:ring-0 bg-transparent"
        />
        <button
          onClick={send}
          className="glass-button bg-primary text-white border-primary/20 h-10 px-8 text-xs font-black shadow-lg shadow-primary/10 active:scale-95 transition-transform"
        >
          SEND
        </button>
      </div>
    </div>
  )
}

