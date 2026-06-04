import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SLIDE_DURATION = 4000 // 4 seconds per slide

const SLIDE_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #2d4a22 100%)',
  'linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #11998e 100%)',
  'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #4a1942 100%)',
  'linear-gradient(135deg, #141e30 0%, #243b55 50%, #141e30 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
]

export default function GitHubWrapped({ githubData }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const intervalRef = useRef(null)

  const profile = githubData?.profile || {}
  const stats = githubData?.stats || {}
  const languages = githubData?.languages || []
  const timeline = githubData?.timeline || []
  const contributions = githubData?.contributions || {}

  // Compute wrapped stats
  const currentYear = new Date().getFullYear()

  // Most active month from heatmap
  const monthCounts = {}
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (contributions.heatmap) {
    contributions.heatmap.forEach(day => {
      if (day.count > 0) {
        const month = parseInt(day.date.split('-')[1], 10) - 1
        monthCounts[month] = (monthCounts[month] || 0) + day.count
      }
    })
  }
  const mostActiveMonthIdx = Object.keys(monthCounts).length > 0
    ? parseInt(Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0][0], 10)
    : new Date().getMonth()
  const mostActiveMonth = monthNames[mostActiveMonthIdx]
  const mostActiveMonthCount = monthCounts[mostActiveMonthIdx] || 0

  // Top language
  const topLang = languages[0]?.name || 'Code'
  const topLangPct = languages[0]?.percentage || 0

  // Biggest repo (by stars)
  const repos = githubData?.repos_summary || []
  const biggestRepo = repos.length > 0 ? repos[0] : null

  // Contribution streak
  const activeDays = contributions.active_days || 0
  const maxDaily = contributions.max_daily || 0
  const totalContributions = contributions.total_contributions || 0

  // Overall grade
  const getOverallGrade = () => {
    let points = 0
    points += Math.min(stats.total_stars * 2, 30)
    points += Math.min(stats.total_repos * 1.5, 25)
    points += Math.min(profile.followers * 0.5, 20)
    points += Math.min(languages.length * 3, 15)
    points += Math.min(activeDays * 0.2, 10)
    if (points >= 80) return { grade: 'S', label: 'LEGENDARY', color: '#fbbf24' }
    if (points >= 60) return { grade: 'A', label: 'ELITE', color: '#a78bfa' }
    if (points >= 40) return { grade: 'B', label: 'RISING STAR', color: '#60a5fa' }
    if (points >= 20) return { grade: 'C', label: 'BUILDER', color: '#34d399' }
    return { grade: 'D', label: 'NEWCOMER', color: '#fb923c' }
  }
  const gradeInfo = getOverallGrade()

  // Most active day of week
  const weeklyData = contributions.weekly || []
  const bestDay = weeklyData.length > 0
    ? weeklyData.reduce((a, b) => a.commits > b.commits ? a : b)
    : { day: 'Mon', commits: 0 }

  const slides = [
    // Slide 0: Intro
    {
      content: (
        <div className="wrapped-slide-content wrapped-intro">
          <div className="wrapped-year-badge">{currentYear}</div>
          <h2 className="wrapped-big-title">Your GitHub Wrapped</h2>
          <div className="wrapped-avatar-ring">
            <img src={profile.avatar} alt={profile.name} className="wrapped-avatar" />
          </div>
          <div className="wrapped-intro-name">{profile.name || profile.username}</div>
          <div className="wrapped-intro-handle">@{profile.username}</div>
        </div>
      )
    },
    // Slide 1: Most Active Month
    {
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-slide-label">YOUR MOST ACTIVE MONTH</div>
          <div className="wrapped-giant-text">{mostActiveMonth}</div>
          <div className="wrapped-giant-subtitle">{mostActiveMonthCount} contributions</div>
          <div className="wrapped-slide-note">
            You were on fire in {mostActiveMonth}! That's when you shipped the most code.
          </div>
        </div>
      )
    },
    // Slide 2: Top Language
    {
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-slide-label">YOUR #1 LANGUAGE</div>
          <div className="wrapped-giant-text">{topLang}</div>
          <div className="wrapped-lang-bar-wrap">
            <div className="wrapped-lang-bar" style={{ width: `${topLangPct}%` }} />
          </div>
          <div className="wrapped-giant-subtitle">{topLangPct}% of your code</div>
          <div className="wrapped-slide-note">
            {topLang} is your weapon of choice. You clearly know what works.
          </div>
        </div>
      )
    },
    // Slide 3: Biggest Repo
    {
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-slide-label">YOUR TOP PROJECT</div>
          <div className="wrapped-giant-text" style={{ fontSize: biggestRepo && biggestRepo.name.length > 16 ? '2rem' : '2.8rem' }}>
            {biggestRepo?.name || 'N/A'}
          </div>
          <div className="wrapped-repo-stats">
            <span>⭐ {biggestRepo?.stars || 0}</span>
            <span>🍴 {biggestRepo?.forks || 0}</span>
            <span>💻 {biggestRepo?.language || 'N/A'}</span>
          </div>
          <div className="wrapped-slide-note">
            {biggestRepo?.description || 'Your most starred repository — the crown jewel.'}
          </div>
        </div>
      )
    },
    // Slide 4: Activity Stats
    {
      content: (
        <div className="wrapped-slide-content">
          <div className="wrapped-slide-label">YOUR CODING RHYTHM</div>
          <div className="wrapped-stats-grid">
            <div className="wrapped-stat-block">
              <div className="wrapped-stat-number">{activeDays}</div>
              <div className="wrapped-stat-desc">Active Days</div>
            </div>
            <div className="wrapped-stat-block">
              <div className="wrapped-stat-number">{maxDaily}</div>
              <div className="wrapped-stat-desc">Max in a Day</div>
            </div>
            <div className="wrapped-stat-block">
              <div className="wrapped-stat-number">{bestDay.day}</div>
              <div className="wrapped-stat-desc">Favorite Day</div>
            </div>
            <div className="wrapped-stat-block">
              <div className="wrapped-stat-number">{totalContributions}</div>
              <div className="wrapped-stat-desc">Total Events</div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 5: Final Grade
    {
      content: (
        <div className="wrapped-slide-content wrapped-finale">
          <div className="wrapped-slide-label">YOUR DEVELOPER GRADE</div>
          <div className="wrapped-grade-ring" style={{ borderColor: gradeInfo.color, boxShadow: `0 0 40px ${gradeInfo.color}40` }}>
            <div className="wrapped-grade-letter" style={{ color: gradeInfo.color }}>{gradeInfo.grade}</div>
          </div>
          <div className="wrapped-grade-label" style={{ color: gradeInfo.color }}>{gradeInfo.label}</div>
          <div className="wrapped-finale-stats">
            <span>{stats.total_repos} repos</span>
            <span>{stats.total_stars} stars</span>
            <span>{profile.followers} followers</span>
            <span>{languages.length} languages</span>
          </div>
          <div className="wrapped-slide-note" style={{ marginTop: '1rem' }}>
            Keep pushing code. The next level is waiting. 🚀
          </div>
        </div>
      )
    }
  ]

  const totalSlides = slides.length

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => {
          if (prev >= totalSlides - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, SLIDE_DURATION)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, totalSlides])

  const startWrapped = () => {
    setCurrentSlide(0)
    setHasStarted(true)
    setIsPlaying(true)
  }

  const goToSlide = (idx) => {
    setIsPlaying(false)
    setCurrentSlide(idx)
  }

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }
  }

  return (
    <motion.div
      className="card github-wrapped-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <div className="card-header">
        <span className="card-header-icon">📊</span>
        <div>
          <div className="card-header-title">GitHub Wrapped {currentYear}</div>
          <div className="card-header-subtitle">Your year in code — Spotify Wrapped style</div>
        </div>
      </div>

      <div className="wrapped-container">
        {!hasStarted ? (
          <div className="wrapped-start-screen" style={{ background: SLIDE_GRADIENTS[0] }}>
            <div className="wrapped-start-content">
              <div className="wrapped-year-badge">{currentYear}</div>
              <h3>Ready to see your GitHub Wrapped?</h3>
              <p>Discover your coding highlights, top language, best projects, and developer grade.</p>
              <button className="wrapped-start-btn" onClick={startWrapped}>
                ▶ Unwrap My Year
              </button>
            </div>
          </div>
        ) : (
          <div className="wrapped-player" style={{ background: SLIDE_GRADIENTS[currentSlide % SLIDE_GRADIENTS.length] }}>
            {/* Progress bar */}
            <div className="wrapped-progress-bar">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`wrapped-progress-segment ${idx < currentSlide ? 'done' : idx === currentSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(idx)}
                >
                  <div
                    className="wrapped-progress-fill"
                    style={{
                      width: idx < currentSlide ? '100%' : idx === currentSlide && isPlaying ? '100%' : idx === currentSlide ? '50%' : '0%',
                      transition: idx === currentSlide && isPlaying ? `width ${SLIDE_DURATION}ms linear` : 'width 0.3s ease'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Slide content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="wrapped-slide"
              >
                {slides[currentSlide].content}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="wrapped-nav">
              <button
                className="wrapped-nav-btn"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                ‹
              </button>
              <button
                className="wrapped-nav-btn wrapped-play-btn"
                onClick={() => {
                  if (isPlaying) {
                    setIsPlaying(false)
                  } else {
                    if (currentSlide >= totalSlides - 1) setCurrentSlide(0)
                    setIsPlaying(true)
                  }
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                className="wrapped-nav-btn"
                onClick={nextSlide}
                disabled={currentSlide >= totalSlides - 1}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
