import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function ProfileBattle({ externalResult }) {
  const [username1, setUsername1] = useState('')
  const [username2, setUsername2] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleBattle = async (e) => {
    e.preventDefault()
    if (!username1.trim() || !username2.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    const token = localStorage.getItem('gitjourney_token') || ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers['X-GitHub-Token'] = token
    }

    try {
      const res = await fetch(`${API_BASE}/battle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username1: username1.trim(),
          username2: username2.trim(),
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Battle failed. Please try again.')
      } else {
        setResult(data.data)
      }
    } catch {
      setError('Could not connect to the server. Is the backend running?')
    }
    setLoading(false)
  }

  const activeResult = externalResult || result
  const p1 = activeResult?.player1
  const p2 = activeResult?.player2
  const battle = activeResult?.battle

  return (
    <div className={externalResult ? "battle-section-external" : "battle-section"} id="battle">
      {!externalResult && (
        <>
          <h2 className="battle-title">⚔️ Profile Battle</h2>
          <p className="battle-subtitle">
            Compare two GitHub profiles head-to-head
          </p>

          <form onSubmit={handleBattle}>
            <div className="battle-input-row">
              <input
                id="battle-username-1"
                className="battle-input"
                type="text"
                placeholder="Username 1"
                value={username1}
                onChange={(e) => setUsername1(e.target.value)}
                disabled={loading}
                maxLength={39}
              />
              <span className="battle-vs">VS</span>
              <input
                id="battle-username-2"
                className="battle-input"
                type="text"
                placeholder="Username 2"
                value={username2}
                onChange={(e) => setUsername2(e.target.value)}
                disabled={loading}
                maxLength={39}
              />
              <button
                id="battle-btn"
                className="battle-btn"
                type="submit"
                disabled={loading || !username1.trim() || !username2.trim()}
              >
                {loading ? '⚡ Fighting...' : '⚔️ Battle!'}
              </button>
            </div>
          </form>
        </>
      )}

      {error && (
        <div className="error-box" style={{ marginBottom: '1.5rem' }}>
          <div className="error-box-icon">😵</div>
          <div className="error-box-text">{error}</div>
        </div>
      )}

      <AnimatePresence>
        {activeResult && p1 && p2 && battle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="battle-results">
              {/* Player 1 */}
              <div className="battle-player">
                <img
                  className={`battle-player-avatar ${
                    battle.winner === p1.profile.username ? 'winner' : ''
                  }`}
                  src={p1.profile.avatar}
                  alt={p1.profile.username}
                />
                <div className="battle-player-name">{p1.profile.name}</div>
                <div className="battle-player-username">
                  @{p1.profile.username}
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="profile-stat">
                    <div className="profile-stat-value">{p1.stats.total_repos}</div>
                    <div className="profile-stat-label">Repos</div>
                  </div>
                  <div className="profile-stat" style={{ marginTop: '0.5rem' }}>
                    <div className="profile-stat-value">{p1.stats.total_stars}</div>
                    <div className="profile-stat-label">Stars</div>
                  </div>
                </div>
              </div>

              {/* Center */}
              <div className="battle-center">
                <div className="battle-vs-big">⚔️</div>
                <div className="battle-categories">
                  {battle.categories &&
                    battle.categories.map((cat) => (
                      <div className="battle-category" key={cat.name}>
                        <span className="battle-category-name">{cat.name}</span>
                        <span className="battle-category-winner">
                          👑 {cat.winner}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Player 2 */}
              <div className="battle-player">
                <img
                  className={`battle-player-avatar ${
                    battle.winner === p2.profile.username ? 'winner' : ''
                  }`}
                  src={p2.profile.avatar}
                  alt={p2.profile.username}
                />
                <div className="battle-player-name">{p2.profile.name}</div>
                <div className="battle-player-username">
                  @{p2.profile.username}
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="profile-stat">
                    <div className="profile-stat-value">{p2.stats.total_repos}</div>
                    <div className="profile-stat-label">Repos</div>
                  </div>
                  <div className="profile-stat" style={{ marginTop: '0.5rem' }}>
                    <div className="profile-stat-value">{p2.stats.total_stars}</div>
                    <div className="profile-stat-label">Stars</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verdict */}
            <div className="battle-verdict">
              <div className="battle-verdict-winner">
                🏆 Winner: {battle.winner}
              </div>
              <div className="battle-verdict-text">{battle.verdict}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
