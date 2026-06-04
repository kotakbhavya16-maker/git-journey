import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function ReadmeGenerator({ githubData }) {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('raw') // 'raw' | 'preview'

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setMarkdown('')
    try {
      const res = await fetch(`${API_BASE}/generate_readme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_data: githubData }),
      })
      const result = await res.json()
      if (result.success) {
        setMarkdown(result.data.markdown)
      } else {
        setError(result.error || 'Failed to generate README.')
      }
    } catch {
      setError('Could not connect to the API server.')
    }
    setLoading(false)
  }

  const handleCopy = () => {
    if (!markdown) return
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="card readme-generator-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <div className="card-header-title">GitHub Profile README Generator</div>
            <div className="card-header-subtitle">Create a stunning bio for your GitHub landing page</div>
          </div>
        </div>

        {!markdown && !loading && (
          <button className="readme-generate-btn" onClick={handleGenerate}>
            Generate README
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            className="readme-loading-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-spinner" style={{ width: 40, height: 40 }} />
            <p>AI is analyzing your stats to craft the perfect README...</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            className="readme-error-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p>😵 {error}</p>
            <button className="error-box-btn" onClick={handleGenerate}>
              Try Again
            </button>
          </motion.div>
        )}

        {markdown && !loading && (
          <motion.div
            key="content"
            className="readme-editor-wrap"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header controls */}
            <div className="readme-editor-header">
              <div className="readme-tabs">
                <button
                  className={`readme-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
                  onClick={() => setActiveTab('raw')}
                >
                  Raw Markdown
                </button>
                <button
                  className={`readme-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  Visual Preview
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="readme-btn-secondary" onClick={handleGenerate}>
                  Regenerate
                </button>
                <button className="readme-btn-primary" onClick={handleCopy}>
                  {copied ? '✅ Copied!' : '📋 Copy Code'}
                </button>
              </div>
            </div>

            {/* Content body */}
            <div className="readme-editor-body">
              {activeTab === 'raw' ? (
                <textarea
                  className="readme-textarea"
                  readOnly
                  value={markdown}
                  onClick={(e) => e.target.select()}
                />
              ) : (
                <div className="readme-preview-content">
                  {/* Parse markdown headlines, lists, tech stack simple representation */}
                  {markdown.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={idx} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3em', marginBottom: '0.5em' }}>{line.slice(2)}</h1>
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={idx} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3em', marginTop: '1em', marginBottom: '0.5em' }}>{line.slice(3)}</h2>
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={idx} style={{ marginTop: '0.8em', marginBottom: '0.4em' }}>{line.slice(4)}</h3>
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return <li key={idx} style={{ marginLeft: '1rem', listStyleType: 'disc' }}>{line.slice(2)}</li>
                    }
                    if (line.trim() === '') {
                      return <br key={idx} />
                    }
                    return <p key={idx} style={{ margin: '0.25rem 0' }}>{line}</p>
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
