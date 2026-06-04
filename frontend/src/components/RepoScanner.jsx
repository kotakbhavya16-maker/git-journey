import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const HEALTH_CHECKS = [
  { key: 'has_description', label: 'Description', icon: '📝' },
  { key: 'has_license', label: 'License', icon: '📜' },
  { key: 'has_topics', label: 'Topics', icon: '🏷️' },
  { key: 'active_development', label: 'Active Dev', icon: '🔄' },
  { key: 'has_contributors', label: 'Contributors', icon: '👥' },
  { key: 'good_documentation', label: 'Documented', icon: '📖' },
]

const GRADE_COLORS = {
  S: '#fbbf24',
  A: '#a78bfa',
  B: '#60a5fa',
  C: '#34d399',
  D: '#f87171',
}

export default function RepoScanner({ username, repoName, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showScore, setShowScore] = useState(false)

  useEffect(() => {
    const fetchScan = async () => {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('gitjourney_token') || ''
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['X-GitHub-Token'] = token
      }

      try {
        const res = await fetch(`${API_BASE}/repo/scan`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, repo: repoName }),
        })
        const result = await res.json()
        if (result.success) {
          setData(result.data)
          // Delay score reveal for animation
          setTimeout(() => setShowScore(true), 500)
        } else {
          setError(result.error || 'Failed to scan repository.')
        }
      } catch {
        setError('Could not connect to the server.')
      }
      setLoading(false)
    }
    fetchScan()
  }, [username, repoName])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const gradeColor = data ? (GRADE_COLORS[data.grade] || '#60a5fa') : '#60a5fa'

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content scanner-modal"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

          {loading && (
            <div className="modal-loading">
              <div className="loading-spinner" />
              <p>🔬 Scanning <strong>{repoName}</strong>...</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Analyzing code quality, health indicators, and maturity
              </p>
            </div>
          )}

          {error && (
            <div className="modal-error">
              <p>😵 {error}</p>
              <button className="error-box-btn" onClick={onClose}>Close</button>
            </div>
          )}

          {data && !loading && (
            <div className="scanner-results">
              {/* Header */}
              <div className="scanner-header">
                <h2 className="scanner-repo-name">🔬 {repoName}</h2>
                <span className="scanner-maturity-badge" style={{
                  borderColor: gradeColor,
                  color: gradeColor
                }}>
                  {data.maturity}
                </span>
              </div>

              {/* Score + Grade */}
              <div className="scanner-score-section">
                <motion.div
                  className="scanner-score-ring"
                  style={{
                    borderColor: gradeColor,
                    boxShadow: `0 0 30px ${gradeColor}30`
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={showScore ? { scale: 1, opacity: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <div className="scanner-score-number" style={{ color: gradeColor }}>
                    {data.quality_score}
                  </div>
                  <div className="scanner-score-label">/ 100</div>
                </motion.div>

                <motion.div
                  className="scanner-grade-badge"
                  style={{ backgroundColor: `${gradeColor}15`, borderColor: `${gradeColor}40`, color: gradeColor }}
                  initial={{ x: 30, opacity: 0 }}
                  animate={showScore ? { x: 0, opacity: 1 } : {}}
                  transition={{ delay: 0.3 }}
                >
                  GRADE {data.grade}
                </motion.div>
              </div>

              {/* Summary */}
              <p className="scanner-summary">{data.summary}</p>

              {/* Health Indicators */}
              <div className="scanner-section">
                <h3 className="scanner-section-title">Health Indicators</h3>
                <div className="scanner-health-grid">
                  {HEALTH_CHECKS.map(check => {
                    const passed = data.health?.[check.key]
                    return (
                      <div
                        key={check.key}
                        className={`scanner-health-item ${passed ? 'passed' : 'failed'}`}
                      >
                        <span className="scanner-health-icon">{check.icon}</span>
                        <span className="scanner-health-label">{check.label}</span>
                        <span className="scanner-health-status">{passed ? '✅' : '❌'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Strengths */}
              {data.strengths && data.strengths.length > 0 && (
                <div className="scanner-section">
                  <h3 className="scanner-section-title">💪 Strengths</h3>
                  <div className="scanner-tags">
                    {data.strengths.map((s, i) => (
                      <span key={i} className="scanner-strength-tag">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {data.suggestions && data.suggestions.length > 0 && (
                <div className="scanner-section">
                  <h3 className="scanner-section-title">💡 Improvement Suggestions</h3>
                  <div className="scanner-suggestions">
                    {data.suggestions.map((tip, i) => (
                      <div key={i} className="scanner-suggestion-item">
                        <span className="scanner-suggestion-num">{i + 1}</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
