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

const BATTLE_LOADING_STEPS = [
  { text: 'Fetching first profile...', icon: '👤' },
  { text: 'Fetching second profile...', icon: '👥' },
  { text: 'Comparing repositories and languages...', icon: '⚔️' },
  { text: 'Evaluating achievements & stats...', icon: '🏆' },
  { text: 'AI generating match verdict...', icon: '🧠' },
]

function App() {
  const [view, setView] = useState('home') // 'home' | 'loading' | 'results' | 'battle-results'
  const [loadingType, setLoadingType] = useState('single') // 'single' | 'battle'
  const [battleData, setBattleData] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [searchedUser, setSearchedUser] = useState('')
  const [theme, setTheme] = useState('github-dark')
  const [exportingPdf, setExportingPdf] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
      console.log('PWA installed successfully!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)
    setInstallPrompt(null)
  }

  const THEMES = [
    { id: 'github-dark', label: '🐈 GitHub Dark' },
    { id: 'neon-cyber', label: '👾 Cyberpunk' },
    { id: 'glass-space', label: '🌌 Cosmic Glass' },
  ]

  const exportToPdf = async () => {
    if (!data) return
    setExportingPdf(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 15
      const contentWidth = pageWidth - (margin * 2) // 180mm

      // Setup running header & footer helper
      const addHeaderAndFooter = (pdfInstance, pageNum, totalPages) => {
        // Header
        pdfInstance.setFont('helvetica', 'normal')
        pdfInstance.setFontSize(8)
        pdfInstance.setTextColor(148, 163, 184) // Slate-400
        pdfInstance.text('GITJOURNEY DEVELOPER REPORT', margin, 12)
        pdfInstance.text('gitjourney.dev', pageWidth - margin, 12, { align: 'right' })
        
        pdfInstance.setDrawColor(226, 232, 240) // Slate-200
        pdfInstance.setLineWidth(0.2)
        pdfInstance.line(margin, 14, pageWidth - margin, 14)

        // Footer
        pdfInstance.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
        pdfInstance.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
        
        const timestamp = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        })
        pdfInstance.text(`Generated: ${timestamp}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
      }

      // Helper to draw clean section header
      const addSectionHeader = (pdfInstance, title, y) => {
        pdfInstance.setFont('helvetica', 'bold')
        pdfInstance.setFontSize(11)
        pdfInstance.setTextColor(37, 99, 235) // Blue-600
        pdfInstance.text(title, margin, y)
        
        pdfInstance.setDrawColor(226, 232, 240) // Slate-200
        pdfInstance.setLineWidth(0.4)
        pdfInstance.line(margin, y + 2, pageWidth - margin, y + 2)
        return y + 7
      }

      // Helper to wrap and print text paragraphs
      const drawTextWrapped = (pdfInstance, text, x, y, width, lineHeight) => {
        const lines = pdfInstance.splitTextToSize(text || '', width)
        lines.forEach((line) => {
          pdfInstance.text(line, x, y)
          y += lineHeight
        })
        return y
      }

      // ============================================
      // PAGE 1
      // ============================================
      addHeaderAndFooter(pdf, 1, 2)

      // Name & Title
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(20)
      pdf.setTextColor(15, 23, 42) // Slate-900
      pdf.text(data.profile.name || data.profile.username, margin, 24)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(37, 99, 235) // Blue-600
      pdf.text(`@${data.profile.username}`, margin, 30)

      // Location, Company, Joined
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(71, 85, 105) // Slate-600
      
      const metaItems = []
      if (data.profile.location && data.profile.location !== 'Unknown') metaItems.push(`📍 ${data.profile.location}`)
      if (data.profile.company) metaItems.push(`🏢 ${data.profile.company}`)
      
      const joinDate = data.profile.created_at
        ? new Date(data.profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Unknown'
      metaItems.push(`📅 Joined ${joinDate}`)
      pdf.text(metaItems.join('   |   '), margin, 36)

      // Bio Paragraph
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(71, 85, 105) // Slate-600
      let currentY = drawTextWrapped(pdf, data.profile.bio, margin, 44, contentWidth, 5)

      // Stats Table Box
      currentY = Math.max(currentY + 3, 58)
      pdf.setFillColor(248, 250, 252) // Slate-50 background
      pdf.rect(margin, currentY, contentWidth, 18, 'F')
      pdf.setDrawColor(226, 232, 240) // Slate-200 border
      pdf.setLineWidth(0.3)
      pdf.rect(margin, currentY, contentWidth, 18, 'S')

      // Render columns in table
      const cols = [
        { label: 'REPOSITORIES', val: data.stats.total_repos },
        { label: 'TOTAL STARS', val: data.stats.total_stars },
        { label: 'FOLLOWERS', val: data.profile.followers },
        { label: 'LANGUAGES', val: data.stats.total_languages },
        { label: 'ON GITHUB', val: `${data.stats.account_age_years} Years` }
      ]
      const colWidth = contentWidth / cols.length // 36mm
      cols.forEach((col, idx) => {
        const xCenter = margin + (idx * colWidth) + (colWidth / 2)
        
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(13)
        pdf.setTextColor(37, 99, 235) // Blue-600
        pdf.text(String(col.val), xCenter, currentY + 7, { align: 'center' })

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7.5)
        pdf.setTextColor(100, 116, 139) // Slate-500
        pdf.text(col.label, xCenter, currentY + 13, { align: 'center' })

        // Vertical divider line
        if (idx < cols.length - 1) {
          const dividerX = margin + ((idx + 1) * colWidth)
          pdf.line(dividerX, currentY + 2, dividerX, currentY + 16)
        }
      })

      // Developer Personality Section
      currentY = addSectionHeader(pdf, 'DEVELOPER PERSONALITY ANALYSIS', currentY + 26)
      
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(15, 23, 42) // Slate-900
      const personalityTitle = `${data.ai?.personality?.emoji || '🧬'} ${data.ai?.personality?.type_name || 'Generic Developer'}`
      pdf.text(personalityTitle, margin, currentY)
      currentY += 5.5

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9.5)
      pdf.setTextColor(71, 85, 105) // Slate-600
      currentY = drawTextWrapped(pdf, data.ai?.personality?.description, margin, currentY, contentWidth, 4.8)

      // Primary Languages Section
      currentY = addSectionHeader(pdf, 'PRIMARY WEAPONS (LANGUAGES)', currentY + 8)

      if (data.languages && data.languages.length > 0) {
        const topLangs = data.languages.slice(0, 5)
        topLangs.forEach((lang, idx) => {
          const rowY = currentY + (idx * 7.5)
          
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(9.5)
          pdf.setTextColor(15, 23, 42) // Slate-900
          pdf.text(lang.name, margin, rowY + 3.5)

          // Draw progress bar
          const barWidth = 90
          const barHeight = 3.5
          const fillWidth = (lang.percentage / 100) * barWidth
          const barX = margin + 50

          pdf.setFillColor(241, 245, 249) // Slate-100 track
          pdf.rect(barX, rowY + 0.5, barWidth, barHeight, 'F')
          
          pdf.setFillColor(37, 99, 235) // Blue-600 fill
          pdf.rect(barX, rowY + 0.5, fillWidth, barHeight, 'F')

          // Percentage Label
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(9)
          pdf.setTextColor(71, 85, 105) // Slate-600
          pdf.text(`${lang.percentage}%`, barX + barWidth + 6, rowY + 3.5)
        })
      } else {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(148, 163, 184)
        pdf.text('No language statistics available.', margin, currentY)
      }

      // ============================================
      // PAGE 2
      // ============================================
      pdf.addPage()
      addHeaderAndFooter(pdf, 2, 2)
      
      currentY = 22

      // AI Journey Summary
      currentY = addSectionHeader(pdf, 'AI-GENERATED EVOLUTION SUMMARY', currentY)
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9.5)
      pdf.setTextColor(71, 85, 105) // Slate-600
      currentY = drawTextWrapped(pdf, data.ai?.journey_summary, margin, currentY, contentWidth, 4.8)

      // Growth Recommendations
      currentY = addSectionHeader(pdf, 'PROFESSIONAL GROWTH RECOMMENDATIONS', currentY + 8)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9.5)
      pdf.setTextColor(71, 85, 105) // Slate-600
      if (data.ai?.tips && data.ai.tips.length > 0) {
        data.ai.tips.forEach((tip) => {
          pdf.text('•', margin, currentY)
          currentY = drawTextWrapped(pdf, tip, margin + 4, currentY, contentWidth - 4, 4.8)
          currentY += 1.5 // small gap between bullet items
        })
      } else {
        pdf.text('No growth recommendations generated.', margin, currentY)
        currentY += 6
      }

      // Coding Journey Timeline
      currentY = addSectionHeader(pdf, 'ANNUAL REPOSITORY EVOLUTION (TIMELINE)', currentY + 6)

      if (data.timeline && data.timeline.length > 0) {
        const maxRepos = Math.max(...data.timeline.map((t) => t.repos), 1)
        data.timeline.forEach((item, idx) => {
          const rowY = currentY + (idx * 7)
          
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(9.5)
          pdf.setTextColor(15, 23, 42) // Slate-900
          pdf.text(String(item.year), margin, rowY + 3.5)

          // Repos label
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(8.5)
          pdf.setTextColor(100, 116, 139) // Slate-500
          pdf.text(`${item.repos} repos`, margin + 18, rowY + 3.5)

          // Draw progress bar
          const barWidth = 90
          const barHeight = 2.5
          const fillWidth = (item.repos / maxRepos) * barWidth
          const barX = margin + 45

          pdf.setFillColor(241, 245, 249) // Slate-100
          pdf.rect(barX, rowY + 1.2, barWidth, barHeight, 'F')
          
          pdf.setFillColor(37, 99, 235) // Blue-600
          pdf.rect(barX, rowY + 1.2, fillWidth, barHeight, 'F')
        })
      } else {
        pdf.text('No annual coding timeline available.', margin, currentY)
      }

      pdf.save(`gitjourney-report-${data.profile.username}.pdf`)
    } catch (err) {
      console.error('PDF Generation failed:', err)
      alert('Failed to generate professional PDF: ' + err.message)
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
        const activeSteps = loadingType === 'battle' ? BATTLE_LOADING_STEPS : LOADING_STEPS
        if (prev >= activeSteps.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [view, loadingType])

  const handleSearch = async (username) => {
    setView('loading')
    setLoadingType('single')
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
    } catch (err) {
      console.error('API Error:', err)
      setError(`Could not connect to the backend at ${API_BASE}. Details: ${err.message || 'Network Error'}`)
      setView('home')
    }
  }

  const handleBattleSearch = async (u1, u2) => {
    setView('loading')
    setLoadingType('battle')
    setError(null)
    setBattleData(null)
    setSearchedUser(`${u1} vs ${u2}`)

    const token = localStorage.getItem('gitjourney_token') || ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers['X-GitHub-Token'] = token
    }

    try {
      const res = await fetch(`${API_BASE}/battle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username1: u1, username2: u2 }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        setError(result.error || 'Battle failed. Please try again.')
        setView('home')
      } else {
        setBattleData(result.data)
        setView('battle-results')
      }
    } catch (err) {
      console.error('Battle API Error:', err)
      setError(`Could not connect to the backend at ${API_BASE}. Details: ${err.message || 'Network Error'}`)
      setView('home')
    }
  }

  const handleBack = () => {
    setView('home')
    setData(null)
    setBattleData(null)
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
            <HeroSearch onSearch={handleSearch} onBattleSearch={handleBattleSearch} loading={false} />

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
                {loadingType === 'battle' ? 'Comparing' : 'Analyzing'} <strong>@{searchedUser}</strong>...
              </div>
              <div className="loading-steps">
                {(loadingType === 'battle' ? BATTLE_LOADING_STEPS : LOADING_STEPS).map((step, i) => (
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

        {/* ===== BATTLE RESULTS ===== */}
        {view === 'battle-results' && battleData && (
          <motion.div
            key="battle-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="results-container">
              <div className="results-header">
                <button
                  id="back-btn"
                  className="results-back-btn"
                  onClick={handleBack}
                >
                  ← Back to Home
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  gitjourney / battle
                </span>
              </div>
              <ProfileBattle externalResult={battleData} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {installPrompt && (
        <button className="pwa-install-btn" onClick={handleInstallClick}>
          📲 Install App
        </button>
      )}
    </div>
  )
}

export default App
