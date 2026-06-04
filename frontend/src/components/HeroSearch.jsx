import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EXAMPLE_USERS = ['torvalds', 'gaearon', 'sindresorhus', 'yyx990803']

export default function HeroSearch({ onSearch, onBattleSearch, loading }) {
  const [activeTab, setActiveTab] = useState('single') // 'single' | 'compare'
  const [username, setUsername] = useState('')
  const [username1, setUsername1] = useState('')
  const [username2, setUsername2] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [token, setToken] = useState(localStorage.getItem('gitjourney_token') || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.trim()) {
      onSearch(username.trim())
    }
  }

  const handleBattleSubmit = (e) => {
    e.preventDefault()
    if (username1.trim() && username2.trim()) {
      onBattleSearch(username1.trim(), username2.trim())
    }
  }

  const handleExample = (name) => {
    setUsername(name)
    onSearch(name)
  }

  const handleSaveToken = (e) => {
    e.preventDefault()
    if (token.trim()) {
      localStorage.setItem('gitjourney_token', token.trim())
    } else {
      localStorage.removeItem('gitjourney_token')
    }
    setShowModal(false)
  }

  return (
    <>
      <section className="hero-section" id="hero">
        <div className="hero-bg-grid" />
        <div className="hero-glow-orb orb-1" />
        <div className="hero-glow-orb orb-2" />
        <div className="hero-glow-orb orb-3" />

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="hero-icon">🐙</div>

          <h1 className="hero-title">
            <span className="gradient-text">GitJourney</span>
          </h1>

          <p className="hero-subtitle">
            Enter any GitHub username and discover their coding journey — 
            complete with AI personality analysis, fun roasts, achievements, 
            and a shareable developer card.
          </p>

          {/* Mode Tab Switcher */}
          <div className="hero-tabs">
            <button
              type="button"
              className={`hero-tab-btn ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
              disabled={loading}
            >
              🔍 Explore Profile
            </button>
            <button
              type="button"
              className={`hero-tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
              onClick={() => setActiveTab('compare')}
              disabled={loading}
            >
              ⚔️ Compare Profiles
            </button>
          </div>

          {activeTab === 'single' ? (
            <form onSubmit={handleSubmit}>
              <div className="hero-search-box">
                <button
                  type="button"
                  className="hero-search-settings-btn"
                  onClick={() => setShowModal(true)}
                  title="GitHub API Settings"
                  aria-label="GitHub API Settings"
                >
                  ⚙️
                </button>
                <span className="hero-search-prefix">github.com/</span>
                <input
                  id="github-username-input"
                  className="hero-search-input"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={39}
                />
                <button
                  id="analyze-btn"
                  className="hero-search-btn"
                  type="submit"
                  disabled={loading || !username.trim()}
                >
                  {loading ? 'Analyzing...' : 'Explore →'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBattleSubmit}>
              <div className="hero-battle-box">
                <button
                  type="button"
                  className="hero-search-settings-btn"
                  onClick={() => setShowModal(true)}
                  title="GitHub API Settings"
                  aria-label="GitHub API Settings"
                  style={{ padding: '0 0.5rem 0 0' }}
                >
                  ⚙️
                </button>
                <div className="hero-battle-inputs">
                  <input
                    id="battle-username-1"
                    className="hero-battle-input"
                    type="text"
                    placeholder="first username"
                    value={username1}
                    onChange={(e) => setUsername1(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={39}
                  />
                  <span className="hero-battle-vs">VS</span>
                  <input
                    id="battle-username-2"
                    className="hero-battle-input"
                    type="text"
                    placeholder="second username"
                    value={username2}
                    onChange={(e) => setUsername2(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={39}
                  />
                </div>
                <button
                  id="battle-btn"
                  className="hero-battle-btn"
                  type="submit"
                  disabled={loading || !username1.trim() || !username2.trim()}
                >
                  {loading ? 'Comparing...' : 'Battle! ⚔️'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'single' && (
            <div className="hero-examples">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                Try:
              </span>
              {EXAMPLE_USERS.map((name) => (
                <button
                  key={name}
                  className="hero-example-chip"
                  onClick={() => handleExample(name)}
                  disabled={loading}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Settings Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            style={{ zIndex: 1100 }}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '450px' }}
            >
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close modal">
                ✕
              </button>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚙️ GitHub API Settings
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Configure your own Personal Access Token (PAT) to increase your rate limit to 5,000 requests/hour and securely analyze your private repositories.
              </p>
              
              <form onSubmit={handleSaveToken}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <label htmlFor="user-token-input" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    GitHub Personal Access Token (PAT)
                  </label>
                  <input
                    id="user-token-input"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      padding: '0.75rem 1rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color var(--transition-fast)'
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    🔒 Stored locally in your browser. Sent over HTTPS directly for your requests.
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="readme-btn-secondary"
                    onClick={() => {
                      localStorage.removeItem('gitjourney_token')
                      setToken('')
                      setShowModal(false)
                    }}
                  >
                    Clear Token
                  </button>
                  <button
                    type="submit"
                    className="readme-btn-primary"
                  >
                    Save & Close
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
