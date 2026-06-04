import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GitJourneyChatbot({ githubData }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hi! I'm GitJourney AI. I've analyzed @${githubData?.profile?.username || 'this user'}'s profile and repositories. Ask me anything about their tech stack, key projects, active years, achievements, or strengths!`
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue.trim()
    if (!text || loading) return

    setInputValue('')
    setMessages((prev) => [...prev, { sender: 'user', text }])
    setLoading(true)

    // Build history in the format expected by the backend
    const chatHistory = messages.slice(1).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text
    }))

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: githubData?.profile?.username,
          github_data: githubData,
          message: text,
          history: chatHistory
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.response }])
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: "I'm sorry, I couldn't reach my AI backend. Please verify your GEMINI_API_KEY is configured on the backend!" }
        ])
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: "Connection failed. Please ensure the backend server is running." }
      ])
    } finally {
      setLoading(false)
    }
  }

  const SUGGESTED_QUESTIONS = [
    { text: '📊 Profile Summary', query: "Give me a summary of this developer's profile." },
    { text: '💻 Tech Stack', query: "What is their primary tech stack and language preference?" },
    { text: '📦 Top Projects', query: "Tell me about their top repositories and projects." },
    { text: '📈 Key Achievements', query: "What are their main achievements and highlights?" }
  ]

  return (
    <div className="chatbot-widget-container">
      {/* Floating Toggle Button */}
      <motion.button
        className="chatbot-float-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <span className="chat-btn-icon">✖</span>
        ) : (
          <span className="chat-btn-icon">✨</span>
        )}
      </motion.button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <div className="chatbot-avatar-circle">
                  <span>🤖</span>
                  <span className="chatbot-online-badge" />
                </div>
                <div>
                  <h4 className="chatbot-header-title">GitJourney AI Assistant</h4>
                  <p className="chatbot-header-subtitle">Chat about @{githubData?.profile?.username}</p>
                </div>
              </div>
              <button className="chatbot-close-x" onClick={() => setIsOpen(false)}>×</button>
            </div>

            {/* Chat Body */}
            <div className="chatbot-body">
              <div className="chatbot-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-bubble-row ${msg.sender}`}>
                    <div className="chat-bubble">
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="chat-bubble-row bot">
                    <div className="chat-bubble typing-bubble">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Suggested Tags (Quick Ask) */}
            {messages.length === 1 && (
              <div className="chatbot-suggestions">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    className="chatbot-suggestion-tag"
                    onClick={() => handleSend(q.query)}
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              className="chatbot-input-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
            >
              <input
                type="text"
                className="chatbot-text-input"
                placeholder="Ask about projects, language, stats..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="chatbot-send-btn"
                disabled={!inputValue.trim() || loading}
              >
                ➔
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
