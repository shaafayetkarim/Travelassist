
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
  const seenIds = useRef<Set<string>>(new Set())
  const polling = useRef<NodeJS.Timer | null>(null)

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
    <div className="max-w-3xl mx-auto h-[calc(100vh-4rem)] p-4 flex flex-col gap-4">
      <div className="flex-1 overflow-y-auto space-y-2 border rounded-lg p-3 bg-white">
        {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet. Say hi!</p>}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2 items-start">
            <div>
              <div className="text-xs text-gray-500">
                {m.sender?.name || 'User'} • {new Date(m.createdAt).toLocaleTimeString()}
              </div>
              <div className="px-3 py-2 bg-gray-100 rounded-lg whitespace-pre-wrap break-words">{m.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="Type a message…"
          className="flex-1 border rounded-md px-3 py-2"
        />
        <button onClick={send} className="px-4 py-2 rounded-md bg-black text-white">Send</button>
      </div>
    </div>
  )
}
