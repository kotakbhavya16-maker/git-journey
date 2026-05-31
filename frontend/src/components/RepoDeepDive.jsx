import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function RepoDeepDive({ username, repoName, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('gitjourney_token') || ''
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['X-GitHub-Token'] = token
      }

      try {
        const res = await fetch(`${API_BASE}/repo`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ username, repo: repoName }),
        })
        const result = await res.json()
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Failed to load repo details.')
        }
      } catch {
        setError('Could not connect to the server.')
      }
      setLoading(false)
    }
    fetchDetails()
  }, [username, repoName])

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const formatSize = (kb) => {
    if (kb < 1024) return `${kb} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

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
          className="modal-content"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>

          {loading && (
            <div className="modal-loading">
              <div className="loading-spinner" />
              <p>Loading repo details...</p>
            </div>
          )}

          {error && (
            <div className="modal-error">
              <p>😵 {error}</p>
              <button className="error-box-btn" onClick={onClose}>Close</button>
            </div>
          )}

          {data && !loading && (
            <div className="repo-detail">
              {/* Header */}
              <div className="repo-detail-header">
                <h2 className="repo-detail-name">
                  📦 {data.name}
                  {data.is_fork && <span className="repo-fork-badge">Fork</span>}
                </h2>
                {data.description && (
                  <p className="repo-detail-desc">{data.description}</p>
                )}
              </div>

              {/* Stats Row */}
              <div className="repo-detail-stats">
                <div className="repo-detail-stat">
                  <span className="repo-detail-stat-value">{data.stars}</span>
                  <span className="repo-detail-stat-label">Stars</span>
                </div>
                <div className="repo-detail-stat">
                  <span className="repo-detail-stat-value">{data.forks}</span>
                  <span className="repo-detail-stat-label">Forks</span>
                </div>
                <div className="repo-detail-stat">
                  <span className="repo-detail-stat-value">{data.watchers}</span>
                  <span className="repo-detail-stat-label">Watchers</span>
                </div>
                <div className="repo-detail-stat">
                  <span className="repo-detail-stat-value">{data.open_issues}</span>
                  <span className="repo-detail-stat-label">Issues</span>
                </div>
                <div className="repo-detail-stat">
                  <span className="repo-detail-stat-value">{formatSize(data.size)}</span>
                  <span className="repo-detail-stat-label">Size</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="repo-detail-info-grid">
                <div className="repo-detail-info-item">
                  <span className="repo-info-label">📅 Created</span>
                  <span className="repo-info-value">{formatDate(data.created_at)}</span>
                </div>
                <div className="repo-detail-info-item">
                  <span className="repo-info-label">🔄 Last Push</span>
                  <span className="repo-info-value">{formatDate(data.pushed_at)}</span>
                </div>
                <div className="repo-detail-info-item">
                  <span className="repo-info-label">🌿 Branch</span>
                  <span className="repo-info-value">{data.default_branch}</span>
                </div>
                {data.license && (
                  <div className="repo-detail-info-item">
                    <span className="repo-info-label">📜 License</span>
                    <span className="repo-info-value">{data.license}</span>
                  </div>
                )}
              </div>

              {/* Languages */}
              {data.languages && data.languages.length > 0 && (
                <div className="repo-detail-section">
                  <h3 className="repo-detail-section-title">💻 Languages</h3>
                  <div className="repo-lang-bar">
                    {data.languages.map((lang) => (
                      <div
                        key={lang.name}
                        className="repo-lang-segment"
                        style={{ width: `${lang.percentage}%` }}
                        title={`${lang.name}: ${lang.percentage}%`}
                      />
                    ))}
                  </div>
                  <div className="repo-lang-list">
                    {data.languages.slice(0, 6).map((lang) => (
                      <span key={lang.name} className="repo-lang-item">
                        {lang.name} <span className="repo-lang-pct">{lang.percentage}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contributors */}
              {data.contributors && data.contributors.length > 0 && (
                <div className="repo-detail-section">
                  <h3 className="repo-detail-section-title">👥 Contributors</h3>
                  <div className="repo-contributors">
                    {data.contributors.map((c) => (
                      <div key={c.username} className="repo-contributor">
                        <img
                          className="repo-contributor-avatar"
                          src={c.avatar}
                          alt={c.username}
                        />
                        <span className="repo-contributor-name">{c.username}</span>
                        <span className="repo-contributor-commits">{c.contributions} commits</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Commits */}
              {data.recent_commits && data.recent_commits.length > 0 && (
                <div className="repo-detail-section">
                  <h3 className="repo-detail-section-title">📝 Recent Commits</h3>
                  <div className="repo-commits">
                    {data.recent_commits.map((cm, i) => (
                      <div key={i} className="repo-commit">
                        <span className="repo-commit-dot" />
                        <div className="repo-commit-info">
                          <span className="repo-commit-msg">{cm.message}</span>
                          <span className="repo-commit-meta">
                            {cm.author} · {formatDate(cm.date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {data.topics && data.topics.length > 0 && (
                <div className="repo-detail-section">
                  <h3 className="repo-detail-section-title">🏷️ Topics</h3>
                  <div className="repo-detail-topics">
                    {data.topics.map((t) => (
                      <span key={t} className="repo-topic-chip">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Open on GitHub */}
              <a
                href={data.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-github-link"
              >
                🔗 Open on GitHub
              </a>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
