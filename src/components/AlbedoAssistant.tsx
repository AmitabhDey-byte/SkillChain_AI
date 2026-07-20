import { Bot, CircleAlert, LoaderCircle, Send, Sparkles, X } from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { chatWithAlbedo, type AssistantMessage } from '../lib/api'
import type { UserRole } from '../lib/onboarding'

type AlbedoAssistantProps = {
  role: UserRole | 'visitor' | null
}

const quickPrompts = [
  'How do Stellar credentials work?',
  'What is Soroban?',
  'How can freelancers use milestone payments?',
]

function visitorAnswer(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('soroban')) {
    return 'Soroban is Stellar’s smart-contract platform. SkillChain uses it to issue, own, and verify portable skill credentials on testnet.'
  }
  if (normalized.includes('milestone') || normalized.includes('payment')) {
    return 'Milestone payments can escrow project funds and release them after agreed evidence is approved. SkillChain’s current MVP focuses on credentials, with payment workflows planned next.'
  }
  if (normalized.includes('wallet') || normalized.includes('albedo') || normalized.includes('freighter')) {
    return 'Freighter is a browser extension, while Albedo is a mobile-friendly web wallet. Both can sign a one-time SkillChain challenge without revealing a private key.'
  }
  if (normalized.includes('credential') || normalized.includes('stellar')) {
    return 'SkillChain credentials bind an evidence-backed AI report to a Stellar wallet and Soroban record, so recruiters can verify ownership and active status independently.'
  }
  return 'I can explain SkillChain credentials, Stellar, Soroban, Freighter, Albedo, and milestone payments. Connect a wallet for personalized Gemini guidance.'
}

export function AlbedoAssistant({ role }: AlbedoAssistantProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: 'assistant', content: 'Hi, I’m Albedo. Ask me about Stellar, Soroban, wallets, verified skills, or blockchain careers.' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const sendMessage = async (value: string) => {
    const message = value.trim()
    if (!message || loading) return
    const history = messages.slice(-10)
    setMessages((current) => [...current, { role: 'user', content: message }])
    setInput('')
    setLoading(true)
    setError(null)
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      if (!role || role === 'visitor') {
        setMessages((current) => [...current, { role: 'assistant', content: visitorAnswer(message) }])
      } else {
        const response = await chatWithAlbedo(message, role, history, controller.signal)
        setMessages((current) => [...current, { role: 'assistant', content: response.reply }])
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
      setError(caughtError instanceof Error ? caughtError.message : 'Albedo could not respond.')
    } finally {
      setLoading(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(input)
  }

  return (
    <div className={open ? 'albedo albedo--open' : 'albedo'}>
      {open && (
        <section className="albedo-panel" aria-label="Albedo blockchain assistant">
          <header><span className="albedo-avatar"><Sparkles size={18} /></span><div><strong>Albedo</strong><small><span /> {role && role !== 'visitor' ? 'Gemini blockchain guide' : 'Zero-cost public guide'}</small></div><button type="button" aria-label="Close Albedo" onClick={() => setOpen(false)}><X size={18} /></button></header>
          <div className="albedo-messages">
            {messages.map((message, index) => <div className={`albedo-message albedo-message--${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
            {loading && <div className="albedo-message albedo-message--assistant albedo-typing"><span /><span /><span /></div>}
            {error && <div className="albedo-error"><CircleAlert size={14} /> {error}</div>}
          </div>
          {messages.length === 1 && <div className="albedo-prompts">{quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => void sendMessage(prompt)}>{prompt}</button>)}</div>}
          <form onSubmit={submit}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Albedo about blockchain…" maxLength={1200} /><button type="submit" aria-label="Send message" disabled={!input.trim() || loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}</button></form>
          <footer>Never share a seed phrase or private key.</footer>
        </section>
      )}
      <button className="albedo-trigger" type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Close Albedo' : 'Open Albedo blockchain assistant'}><Bot size={21} /><span>Ask Albedo</span><i /></button>
    </div>
  )
}
