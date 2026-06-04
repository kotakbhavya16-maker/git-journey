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
import ProfileStrength from './components/ProfileStrength'
import PortfolioBuilder from './components/PortfolioBuilder'

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
    { id: 'slate-minimal', label: '💼 Minimal Slate' },
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

      // Helper to strip emojis and non-ASCII characters to prevent garbled PDF text (like Ø>Ý)
      const cleanTextForPdf = (text) => {
        if (!text) return ''
        return String(text)
          .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis
          .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Miscellaneous symbols
          .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
          .replace(/[^\x00-\x7F]/g, '')           // Strip all other non-ASCII characters
          .replace(/\s+/g, ' ')                   // Normalize whitespaces
          .trim()
      }

      // Setup running header & footer helper
      const addHeaderAndFooter = (pdfInstance, pageNum, totalPages) => {
        // Dark slate top bar accent
        pdfInstance.setFillColor(15, 23, 42) // Slate-900
        pdfInstance.rect(0, 0, pageWidth, 5, 'F')
        
        // Royal Blue top secondary accent
        pdfInstance.setFillColor(37, 99, 235) // Blue-600
        pdfInstance.rect(0, 5, pageWidth, 1.5, 'F')

        // Header Text
        pdfInstance.setFont('helvetica', 'bold')
        pdfInstance.setFontSize(8)
        pdfInstance.setTextColor(100, 116, 139) // Slate-500
        pdfInstance.text('GITJOURNEY DEVELOPER INSIGHTS', margin, 12)
        pdfInstance.text(`REPORT ID: #${cleanTextForPdf(data.profile.username).toUpperCase()}`, pageWidth - margin, 12, { align: 'right' })
        
        pdfInstance.setDrawColor(226, 232, 240) // Slate-200
        pdfInstance.setLineWidth(0.25)
        pdfInstance.line(margin, 14, pageWidth - margin, 14)

        // Footer
        pdfInstance.setDrawColor(226, 232, 240) // Slate-200
        pdfInstance.setLineWidth(0.25)
        pdfInstance.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
        
        pdfInstance.setFont('helvetica', 'normal')
        pdfInstance.setFontSize(8)
        pdfInstance.setTextColor(148, 163, 184) // Slate-400
        pdfInstance.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
        
        const timestamp = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        })
        pdfInstance.text(`Generated: ${timestamp}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
      }

      // Helper to draw clean section header with modern vertical left accent bar
      const addSectionHeader = (pdfInstance, title, y) => {
        pdfInstance.setFillColor(37, 99, 235) // Blue-600
        pdfInstance.rect(margin, y, 1.5, 5, 'F')

        pdfInstance.setFont('helvetica', 'bold')
        pdfInstance.setFontSize(10)
        pdfInstance.setTextColor(15, 23, 42) // Slate-900
        pdfInstance.text(title, margin + 4, y + 3.8)
        
        pdfInstance.setDrawColor(226, 232, 240) // Slate-200
        pdfInstance.setLineWidth(0.25)
        pdfInstance.line(margin, y + 6.5, pageWidth - margin, y + 6.5)
        return y + 9
      }

      // ============================================
      // PAGE 1
      // ============================================
      addHeaderAndFooter(pdf, 1, 2)

      // Draw Profile Monogram/Avatar Circle
      pdf.setFillColor(37, 99, 235) // Blue-600
      pdf.circle(margin + 10, 23 + 10, 10, 'F')

      const monogramLetter = cleanTextForPdf(data.profile.name || data.profile.username || 'G').charAt(0).toUpperCase()
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(22)
      pdf.text(monogramLetter, margin + 10, 23 + 13.5, { align: 'center' })

      // Name & Handle
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.setTextColor(15, 23, 42) // Slate-900
      pdf.text(cleanTextForPdf(data.profile.name || data.profile.username), margin + 25, 27)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9.5)
      pdf.setTextColor(37, 99, 235) // Blue-600
      pdf.text(`@${cleanTextForPdf(data.profile.username)}`, margin + 25, 31.5)

      // Location, Company, Joined
      const metaItems = []
      const loc = cleanTextForPdf(data.profile.location)
      if (loc && loc !== 'Unknown') metaItems.push(`Location: ${loc}`)
      const comp = cleanTextForPdf(data.profile.company)
      if (comp) metaItems.push(`Company: ${comp}`)
      
      const joinDate = data.profile.created_at
        ? new Date(data.profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Unknown'
      metaItems.push(`Joined: ${joinDate}`)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(100, 116, 139) // Slate-500
      pdf.text(metaItems.join('   |   '), margin + 25, 36.5)

      // Bio Paragraph (pushed down to y=48 to avoid monogram overlap)
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(8.5)
      pdf.setTextColor(71, 85, 105) // Slate-600
      const bioText = cleanTextForPdf(data.profile.bio || 'No developer biography provided.')
      const bioLines = pdf.splitTextToSize(bioText, contentWidth)
      let bioEndY = 48
      bioLines.slice(0, 3).forEach((line, idx) => {
        pdf.text(line, margin, 48 + idx * 4)
        bioEndY = 48 + (idx + 1) * 4
      })

      // KPI Stats Cards (Row of 5 Rounded Rects)
      const statsY = Math.max(bioEndY + 4, 52)
      const cardW = (contentWidth - 8) / 5 // approx 34.4mm wide
      const stats = [
        { label: 'REPOSITORIES', val: data.stats.total_repos },
        { label: 'TOTAL STARS', val: data.stats.total_stars },
        { label: 'FOLLOWERS', val: data.profile.followers },
        { label: 'LANGUAGES', val: data.stats.total_languages },
        { label: 'ON GITHUB', val: `${data.stats.account_age_years} Yrs` }
      ]

      stats.forEach((item, idx) => {
        const cardX = margin + idx * (cardW + 2)
        // Background card fill
        pdf.setFillColor(248, 250, 252) // Slate-50
        pdf.setDrawColor(226, 232, 240) // Slate-200
        pdf.setLineWidth(0.3)
        pdf.roundedRect(cardX, statsY, cardW, 19, 2, 2, 'FD')

        // Value
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11.5)
        pdf.setTextColor(37, 99, 235) // Blue-600
        pdf.text(String(item.val), cardX + cardW / 2, statsY + 8.5, { align: 'center' })

        // Label
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(6.5)
        pdf.setTextColor(100, 116, 139) // Slate-500
        pdf.text(item.label, cardX + cardW / 2, statsY + 14.5, { align: 'center' })
      })

      // Developer DNA Section
      const dnaY = statsY + 23
      const dnaContentY = addSectionHeader(pdf, 'COGNITIVE DNA & PERSONALITY', dnaY)
      
      // Left Column Card: Personality Type Details
      const leftColW = 78
      pdf.setFillColor(248, 250, 252)
      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.3)
      pdf.roundedRect(margin, dnaContentY, leftColW, 52, 2.5, 2.5, 'FD')

      // Large Title
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10.5)
      pdf.setTextColor(37, 99, 235) // Blue-600
      const personalityTitle = cleanTextForPdf(data.ai?.personality?.type_name || 'Core Developer')
      pdf.text(personalityTitle, margin + leftColW / 2, dnaContentY + 10, { align: 'center' })

      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin + 6, dnaContentY + 14, margin + leftColW - 6, dnaContentY + 14)

      // Description
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(71, 85, 105) // Slate-600
      const personalityDesc = cleanTextForPdf(data.ai?.personality?.description || 'A developer who thrives on solving tough engineering challenges.')
      const descLines = pdf.splitTextToSize(personalityDesc, leftColW - 10)
      descLines.slice(0, 7).forEach((line, idx) => {
        pdf.text(line, margin + 5, dnaContentY + 20 + idx * 4)
      })

      // Right Column Card: Behavioral traits
      const rightColX = margin + leftColW + 4 // 15 + 78 + 4 = 97
      const rightColW = contentWidth - leftColW - 4 // 98mm
      pdf.setFillColor(248, 250, 252)
      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.3)
      pdf.roundedRect(rightColX, dnaContentY, rightColW, 52, 2.5, 2.5, 'FD')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8.5)
      pdf.setTextColor(100, 116, 139) // Slate-500
      pdf.text('BEHAVIORAL DIMENSIONS', rightColX + 5, dnaContentY + 6.5)

      if (data.ai?.personality?.traits && data.ai.personality.traits.length > 0) {
        // Show up to 4 traits with adjusted vertical coordinates to prevent overlaps
        data.ai.personality.traits.slice(0, 4).forEach((trait, i) => {
          const traitY = dnaContentY + 6.5 + i * 11
          
          // Trait Name & Score
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(7.5)
          pdf.setTextColor(15, 23, 42) // Slate-900
          pdf.text(cleanTextForPdf(trait.name), rightColX + 5, traitY + 2)

          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(7.5)
          pdf.setTextColor(37, 99, 235) // Blue-600
          pdf.text(`${trait.score}/100`, rightColX + rightColW - 5, traitY + 2, { align: 'right' })

          // Progress Track
          pdf.setFillColor(226, 232, 240)
          pdf.rect(rightColX + 5, traitY + 3.5, rightColW - 10, 2, 'F')

          // Progress Fill
          pdf.setFillColor(37, 99, 235)
          const fillW = (trait.score / 100) * (rightColW - 10)
          pdf.rect(rightColX + 5, traitY + 3.5, fillW, 2, 'F')

          // Label
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7)
          pdf.setTextColor(100, 116, 139)
          pdf.text(cleanTextForPdf(trait.label), rightColX + 5, traitY + 8)
        })
      }

      // Primary Languages Section
      const langY = dnaContentY + 56
      const langContentY = addSectionHeader(pdf, 'CORE TECHNOLOGY STACK', langY)

      const topLangs = data.languages ? data.languages.slice(0, 5) : []
      const langCardHeight = topLangs.length > 0 ? (topLangs.length * 6.2) + 7 : 14

      pdf.setFillColor(248, 250, 252)
      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.3)
      pdf.roundedRect(margin, langContentY, contentWidth, langCardHeight, 2.5, 2.5, 'FD')

      if (topLangs.length > 0) {
        const barColors = [
          [37, 99, 235],   // Blue-600
          [99, 102, 241],  // Indigo-500
          [13, 148, 136],  // Teal-500
          [168, 85, 247],  // Purple-500
          [245, 158, 11]   // Amber-500
        ]
        
        topLangs.forEach((lang, idx) => {
          const rowY = langContentY + 4 + (idx * 6.2)
          
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(8.2)
          pdf.setTextColor(15, 23, 42) // Slate-900
          pdf.text(cleanTextForPdf(lang.name), margin + 5, rowY + 2.5)

          // Percentage Label
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(8.2)
          pdf.setTextColor(71, 85, 105) // Slate-600
          pdf.text(`${lang.percentage}%`, margin + contentWidth - 5, rowY + 2.5, { align: 'right' })

          // Draw progress bar
          const barWidth = 110
          const barHeight = 1.8
          const fillWidth = (lang.percentage / 100) * barWidth
          const barX = margin + 40

          pdf.setFillColor(226, 232, 240) // Slate-200 track
          pdf.rect(barX, rowY + 1.2, barWidth, barHeight, 'F')
          
          // Custom color coded fill
          const color = barColors[idx % barColors.length]
          pdf.setFillColor(color[0], color[1], color[2])
          pdf.rect(barX, rowY + 1.2, fillWidth, barHeight, 'F')
        })
      } else {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.setTextColor(148, 163, 184)
        pdf.text('No language statistics available.', margin + 5, langContentY + 8)
      }

      // Profile Strengthening Suggestions Section (Dynamic Height & Wrap Fix)
      const roastY = langContentY + langCardHeight + 4
      const roastContentY = addSectionHeader(pdf, 'PROFILE STRENGTHENING SUGGESTIONS', roastY)

      // 1. Calculate dynamic height based on wrapped lines
      let calculatedCardHeight = 6
      const tipsList = data.ai?.tips || []
      if (tipsList.length > 0) {
        tipsList.slice(0, 3).forEach((tip) => {
          const lines = pdf.splitTextToSize(cleanTextForPdf(tip), contentWidth - 15)
          calculatedCardHeight += (lines.length * 3.8) + 1.8
        })
      } else {
        calculatedCardHeight = 14
      }

      // 2. Draw card container first (so fill doesn't overwrite text)
      pdf.setFillColor(240, 249, 255) // Soft Blue-50
      pdf.setDrawColor(147, 197, 253) // Blue-300 border
      pdf.setLineWidth(0.35)
      pdf.roundedRect(margin, roastContentY, contentWidth, calculatedCardHeight, 2.5, 2.5, 'FD')

      // 3. Draw bullet items and full wrapped texts
      let currentTipY = roastContentY + 4.5
      if (tipsList.length > 0) {
        tipsList.slice(0, 3).forEach((tip) => {
          const cleanedTip = cleanTextForPdf(tip)
          const wrappedTipLines = pdf.splitTextToSize(cleanedTip, contentWidth - 15)
          
          // Bullet point circle icon next to first line of text
          pdf.setFillColor(37, 99, 235) // Blue-600
          pdf.circle(margin + 5, currentTipY + 1.2, 0.9, 'F')

          wrappedTipLines.forEach((line) => {
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(8)
            pdf.setTextColor(30, 41, 59) // Slate-800
            pdf.text(line, margin + 9, currentTipY + 2.1)
            currentTipY += 3.8
          })
          currentTipY += 1.8 // Gap between bullet items
        })
      } else {
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(8.5)
        pdf.setTextColor(148, 163, 184)
        pdf.text('No strengthening tips available at this time.', margin + 6, roastContentY + 8)
      }

      // ============================================
      // PAGE 2
      // ============================================
      pdf.addPage()
      addHeaderAndFooter(pdf, 2, 2)
      
      let page2Y = 22

      // Section: AI Journey Summary
      const summaryContentY = addSectionHeader(pdf, 'DEVELOPER EVOLUTION SUMMARY', page2Y)
      
      const summaryText = cleanTextForPdf(data.ai?.journey_summary || 'Analysis completed successfully.')
      const summaryLines = pdf.splitTextToSize(summaryText, contentWidth - 10)
      const summaryCardHeight = Math.max(22, (summaryLines.length * 4.2) + 8)

      pdf.setFillColor(248, 250, 252)
      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.3)
      pdf.roundedRect(margin, summaryContentY, contentWidth, summaryCardHeight, 2.5, 2.5, 'FD')

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.5)
      pdf.setTextColor(51, 65, 85) // Slate-700
      summaryLines.forEach((line, idx) => {
        pdf.text(line, margin + 5, summaryContentY + 6.5 + idx * 4.2)
      })

      // Section: Achievements/Milestones Grid
      const milestonesY = summaryContentY + summaryCardHeight + 4
      const milestoneContentY = addSectionHeader(pdf, 'ACHIEVED MILESTONES & BADGES', milestonesY)

      const achs = data.achievements || []
      const achColW = (contentWidth - 6) / 3 // 3 columns, ~58mm each
      const totalAchs = Math.min(achs.length, 9)
      const rowsCount = Math.ceil(totalAchs / 3)
      const achGridHeight = rowsCount > 0 ? (rowsCount * 16.5) - 2.5 : 14
      
      if (totalAchs > 0) {
        achs.slice(0, 9).forEach((badge, idx) => {
          const col = idx % 3
          const row = Math.floor(idx / 3)
          const cardX = margin + col * (achColW + 3)
          const cardY = milestoneContentY + row * 16.5

          // Color based on status
          if (badge.unlocked) {
            pdf.setFillColor(240, 253, 250) // Emerald-50
            pdf.setDrawColor(153, 246, 228) // Teal-200
          } else {
            pdf.setFillColor(248, 250, 252) // Slate-50
            pdf.setDrawColor(226, 232, 240) // Slate-200
          }
          pdf.setLineWidth(0.3)
          pdf.roundedRect(cardX, cardY, achColW, 14, 2, 2, 'FD')

          // Draw small color token instead of raw unicode emoji which might fail to render
          pdf.setFillColor(badge.unlocked ? 13 : 148, badge.unlocked ? 148 : 163, badge.unlocked ? 136 : 184)
          pdf.circle(cardX + 4.5, cardY + 5, 1.8, 'F')

          // Title
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(7.5)
          pdf.setTextColor(15, 23, 42) // Slate-900
          pdf.text(cleanTextForPdf(badge.name), cardX + 8.5, cardY + 4.5)

          // Status Badge
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(5.8)
          pdf.setTextColor(badge.unlocked ? 13 : 100, badge.unlocked ? 148 : 116, badge.unlocked ? 136 : 139)
          pdf.text(badge.unlocked ? 'UNLOCKED' : 'LOCKED', cardX + 8.5, cardY + 7.5)

          // Description
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(6.5)
          pdf.setTextColor(71, 85, 105) // Slate-600
          const badgeDescLines = pdf.splitTextToSize(cleanTextForPdf(badge.description || ''), achColW - 7)
          pdf.text(badgeDescLines[0] || '', cardX + 3.5, cardY + 11.2)
        })
      } else {
        pdf.setFillColor(248, 250, 252)
        pdf.setDrawColor(226, 232, 240)
        pdf.roundedRect(margin, milestoneContentY, contentWidth, 14, 2.5, 2.5, 'FD')
        
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(8.5)
        pdf.setTextColor(148, 163, 184)
        pdf.text('No milestones currently unlocked.', margin + 6, milestoneContentY + 8)
      }

      // Section: Repository Timeline
      const timelineY = milestoneContentY + achGridHeight + 4
      const timelineContentY = addSectionHeader(pdf, 'ANNUAL REPOSITORY EVOLUTION (TIMELINE)', timelineY)

      const timelineCardHeight = 38
      pdf.setFillColor(248, 250, 252)
      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.3)
      pdf.roundedRect(margin, timelineContentY, contentWidth, timelineCardHeight, 2.5, 2.5, 'FD')

      const timeData = data.timeline || []
      if (timeData.length > 0) {
        const topTimeline = timeData.slice(-5) // last 5 years
        const maxTimelineRepos = Math.max(...topTimeline.map((t) => t.repos), 1)
        const timelineSteps = topTimeline.length
        const totalTimelineHeight = 26
        const stepH = totalTimelineHeight / Math.max(timelineSteps - 1, 1)

        // Draw vertical center track line
        pdf.setDrawColor(226, 232, 240)
        pdf.setLineWidth(0.8)
        pdf.line(margin + 22, timelineContentY + 6, margin + 22, timelineContentY + 6 + (timelineSteps - 1) * stepH)

        topTimeline.forEach((item, idx) => {
          const rowY = timelineContentY + 6 + (idx * stepH)
          
          // Year text label
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(8.2)
          pdf.setTextColor(15, 23, 42) // Slate-900
          pdf.text(String(item.year), margin + 6, rowY + 1.2)

          // Node Circle
          pdf.setFillColor(37, 99, 235) // Blue-600
          pdf.circle(margin + 22, rowY, 1.8, 'F')

          // Quantity text label
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7.5)
          pdf.setTextColor(100, 116, 139) // Slate-500
          pdf.text(`${item.repos} repos`, margin + 27, rowY + 1)

          // Progress bar track
          const barWidth = 100
          const barHeight = 1.8
          const fillWidth = (item.repos / maxTimelineRepos) * barWidth
          const barX = margin + 46

          pdf.setFillColor(241, 245, 249) // Slate-100 track
          pdf.rect(barX, rowY - 1, barWidth, barHeight, 'F')
          
          pdf.setFillColor(37, 99, 235) // Blue-600 fill
          pdf.rect(barX, rowY - 1, fillWidth, barHeight, 'F')
        })
      } else {
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(8.5)
        pdf.setTextColor(148, 163, 184)
        pdf.text('No annual coding timeline records found.', margin + 6, timelineContentY + 12)
      }

      // Section: Top Repositories & Projects
      const recommendationsY = timelineContentY + timelineCardHeight + 4
      const recommendationsContentY = addSectionHeader(pdf, 'TOP REPOSITORIES & PROJECTS', recommendationsY)

      const topRepos = data.repos_summary ? data.repos_summary.slice(0, 3) : []
      const reposCardHeight = topRepos.length > 0 ? (topRepos.length * 8.8) + 4.6 : 14

      pdf.setFillColor(248, 250, 252)
      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.3)
      pdf.roundedRect(margin, recommendationsContentY, contentWidth, reposCardHeight, 2.5, 2.5, 'FD')

      if (topRepos.length > 0) {
        topRepos.forEach((repo, idx) => {
          const repoRowY = recommendationsContentY + 3.2 + idx * 8.8
          
          // Repo Name (truncated to 40 characters max)
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(8.2)
          pdf.setTextColor(37, 99, 235) // Blue-600
          const rawName = repo.name || ''
          const cleanName = cleanTextForPdf(rawName)
          const repoName = cleanName.length > 40 ? cleanName.slice(0, 37) + '...' : cleanName
          pdf.text(repoName, margin + 5, repoRowY + 2)

          // Repo Meta (Language & Stars) - Aligned to the right to prevent overlaps
          const repoMeta = []
          if (repo.language) repoMeta.push(cleanTextForPdf(repo.language))
          repoMeta.push(`${repo.stars || 0} stars`)
          
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(7.5)
          pdf.setTextColor(100, 116, 139) // Slate-500
          pdf.text(repoMeta.join('  |  '), pageWidth - margin - 5, repoRowY + 2, { align: 'right' })

          // Description (Increased width to contentWidth - 10 to display more text)
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7.5)
          pdf.setTextColor(71, 85, 105) // Slate-600
          const descText = cleanTextForPdf(repo.description || 'No repository description provided.')
          const descLines = pdf.splitTextToSize(descText, contentWidth - 10)
          pdf.text(descLines[0] || '', margin + 5, repoRowY + 5.2)
        })
      } else {
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(8.5)
        pdf.setTextColor(148, 163, 184)
        pdf.text('No repository data available at this time.', margin + 6, recommendationsContentY + 8)
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
                    {exportingPdf ? 'Generating...' : 'Export PDF'}
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

                {/* Journey Summary */}
                {data.ai && (
                  <motion.div
                    className="card grid-col-span-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <div className="card-header">
                      <div>
                        <div className="card-header-title">Journey Summary</div>
                        <div className="card-header-subtitle">AI-generated narrative of your coding evolution</div>
                      </div>
                    </div>
                    <div className="journey-summary-text">
                      {data.ai.journey_summary}
                    </div>
                  </motion.div>
                )}

                {/* Profile Strength suggestions */}
                {data.ai && (
                  <div className="grid-col-span-2">
                    <ProfileStrength 
                      profile={data.profile} 
                      stats={data.stats} 
                      achievements={data.achievements} 
                      tips={data.ai.tips} 
                    />
                  </div>
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

                {/* Dev Portfolio Page Builder */}
                {data && (
                  <div className="grid-col-span-2">
                    <PortfolioBuilder githubData={data} />
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
          Install App
        </button>
      )}
    </div>
  )
}

export default App
