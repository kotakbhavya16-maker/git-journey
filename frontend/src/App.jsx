import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'
import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'

import HeroSearch from './components/HeroSearch'
import ProfileCard from './components/ProfileCard'
import JourneyTimeline from './components/JourneyTimeline'
import LanguageChart from './components/LanguageChart'
import DevPersonality from './components/DevPersonality'
import AiRoast from './components/AiRoast'
import Achievements from './components/Achievements'
import ShareableCard from './components/ShareableCard'
import ProfileBattle from './components/ProfileBattle'
import ContributionHeatmap from './components/ContributionHeatmap'
import TopRepos from './components/TopRepos'
import CommitActivity from './components/CommitActivity'
import ReadmeGenerator from './components/ReadmeGenerator'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const LOADING_STEPS = [
  { text: 'Fetching GitHub profile...', icon: '🐙' },
  { text: 'Analyzing repositories...', icon: '📦' },
  { text: 'Computing language stats...', icon: '💻' },
  { text: 'Generating AI personality...', icon: '🧬' },
  { text: 'Crafting your roast...', icon: '🔥' },
]

function App() {
  const [view, setView] = useState('home') // 'home' | 'loading' | 'results'
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [searchedUser, setSearchedUser] = useState('')
  const [theme, setTheme] = useState('github-dark')
  const [exportingPdf, setExportingPdf] = useState(false)

  const THEMES = [
    { id: 'github-dark', label: '🐈 GitHub Dark' },
    { id: 'neon-cyber', label: '👾 Cyberpunk' },
    { id: 'glass-space', label: '🌌 Cosmic Glass' },
  ]

  const exportToPdf = async () => {
    const cards = document.querySelectorAll('.results-grid > .card, .results-grid > div > .card')
    if (!cards || cards.length === 0) return

    setExportingPdf(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 10
      const contentWidth = pageWidth - (margin * 2)

      const paintBackground = (pdfInstance) => {
        pdfInstance.setFillColor(13, 17, 23) // #0d1117
        pdfInstance.rect(0, 0, pageWidth, pageHeight, 'F')
      }

      let currentY = 15

      // Paint first page background
      paintBackground(pdf)

      // Add a nice Title Header on the first page
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.setTextColor(230, 237, 243) // #e6edf3
      pdf.text(`GitJourney Developer Report: @${data.profile.username}`, margin, currentY)
      currentY += 12

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]

        // Skip shareable card or any hidden cards
        if (card.classList.contains('share-card-preview') || card.offsetHeight === 0) {
          continue
        }

        // Render card
        const dataUrl = await toPng(card, {
          backgroundColor: '#1c2333',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
          },
          quality: 0.95,
        })

        // Calculate card height on PDF page
        const cardWidth = contentWidth
        const cardHeight = (card.offsetHeight * cardWidth) / card.offsetWidth

        // If card exceeds page height, add a page
        if (currentY + cardHeight > pageHeight - margin) {
          pdf.addPage()
          paintBackground(pdf)
          currentY = 15 // Reset Y for new page
        }

        pdf.addImage(dataUrl, 'PNG', margin, currentY, cardWidth, cardHeight)
        currentY += cardHeight + 8 // spacing between cards
      }

      pdf.save(`gitjourney-${data.profile.username}.pdf`)
    } catch (err) {
      console.error('PDF Generation failed:', err)
      alert('Failed to generate PDF. Try printing the page instead!')
    } finally {
      setExportingPdf(false)
    }
  }

  // Animate loading steps
  useEffect(() => {
    if (view !== 'loading') return
    setLoadingStep(0)
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= LOADING_STEPS.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [view])

  const handleSearch = async (username) => {
    setView('loading')
    setError(null)
    setData(null)
    setSearchedUser(username)

    const token = localStorage.getItem('gitjourney_token') || ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers['X-GitHub-Token'] = token
    }

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        setError(result.error || 'Something went wrong. Please try again.')
        setView('home')
      } else {
        setData(result.data)
        setView('results')
      }
    } catch {
      setError('Could not connect to the backend. Make sure the Flask server is running on port 5000.')
      setView('home')
    }
  }

  const handleBack = () => {
    setView('home')
    setData(null)
    setError(null)
  }

  return (
    <div className={`app theme-${theme}`}>
      <AnimatePresence mode="wait">
        {/* ===== HOME / SEARCH ===== */}
        {view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HeroSearch onSearch={handleSearch} loading={false} />

            {error && (
              <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
                <div className="error-box">
                  <div className="error-box-icon">😵</div>
                  <div className="error-box-text">{error}</div>
                  <button className="error-box-btn" onClick={() => setError(null)}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== LOADING ===== */}
        {view === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="loading-section">
              <div className="loading-spinner" />
              <div className="loading-text">
                Analyzing <strong>@{searchedUser}</strong>...
              </div>
              <div className="loading-steps">
                {LOADING_STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={`loading-step ${
                      i < loadingStep ? 'done' : i === loadingStep ? 'active' : ''
                    }`}
                  >
                    <span className="loading-step-icon">
                      {i < loadingStep ? '✅' : step.icon}
                    </span>
                    {step.text}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== RESULTS ===== */}
        {view === 'results' && data && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="results-container">
              <div className="results-header">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    id="back-btn"
                    className="results-back-btn"
                    onClick={handleBack}
                  >
                    ← Analyze Another
                  </button>

                  {/* Theme Selector */}
                  <div className="theme-selector-wrap">
                    <select
                      className="theme-select"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    >
                      {THEMES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PDF Export Button */}
                  <button
                    className="results-pdf-btn"
                    onClick={exportToPdf}
                    disabled={exportingPdf}
                  >
                    {exportingPdf ? '⏳ Generating...' : '📄 Export PDF'}
                  </button>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  gitjourney / {data.profile.username}
                </span>
              </div>

              <div className="results-grid">
                {/* Profile Card */}
                <div className="grid-col-span-2">
                  <ProfileCard profile={data.profile} stats={data.stats} />
                </div>

                {/* Contribution Heatmap */}
                {data.contributions && (
                  <div className="grid-col-span-2">
                    <ContributionHeatmap contributions={data.contributions} />
                  </div>
                )}

                {/* Commit Activity Peaks */}
                {data.contributions && (
                  <div className="grid-col-span-2">
                    <CommitActivity contributions={data.contributions} />
                  </div>
                )}

                {/* Journey Timeline */}
                <div>
                  <JourneyTimeline timeline={data.timeline} />
                </div>

                {/* Language Chart */}
                <div>
                  <LanguageChart languages={data.languages} />
                </div>

                {/* Dev Personality */}
                {data.ai?.personality && (
                  <div>
                    <DevPersonality personality={data.ai.personality} />
                  </div>
                )}

                {/* AI Roast */}
                {data.ai?.roast && (
                  <div>
                    <AiRoast roast={data.ai.roast} />
                  </div>
                )}

                {/* Journey Summary & Tips */}
                {data.ai && (
                  <motion.div
                    className="card grid-col-span-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <div className="card-header">
                      <span className="card-header-icon">📖</span>
                      <div>
                        <div className="card-header-title">Journey Summary</div>
                        <div className="card-header-subtitle">AI-generated narrative of your coding evolution</div>
                      </div>
                    </div>
                    <div className="journey-summary-text">
                      {data.ai.journey_summary}
                    </div>

                    {data.ai.tips && data.ai.tips.length > 0 && (
                      <div className="journey-tips">
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          💡 Growth Tips
                        </div>
                        {data.ai.tips.map((tip, i) => (
                          <div className="journey-tip" key={i}>
                            <span className="journey-tip-icon">✦</span>
                            {tip}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Top Repositories with Deep Dive */}
                {data.repos_summary && (
                  <div className="grid-col-span-2">
                    <TopRepos repos={data.repos_summary} username={data.profile.username} />
                  </div>
                )}

                {/* AI Profile README Generator */}
                {data && (
                  <div className="grid-col-span-2">
                    <ReadmeGenerator githubData={data} />
                  </div>
                )}

                {/* Achievements */}
                <div className="grid-col-span-2">
                  <Achievements achievements={data.achievements} />
                </div>

                {/* Shareable Card */}
                <div className="grid-col-span-2">
                  <ShareableCard
                    profile={data.profile}
                    stats={data.stats}
                    languages={data.languages}
                    ai={data.ai}
                  />
                </div>
              </div>

              {/* Profile Battle */}
              <ProfileBattle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
