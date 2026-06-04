import { motion } from 'framer-motion'

export default function ProfileStrength({ profile, stats, achievements, tips }) {
  if (!profile || !stats) return null

  // Calculate profile strength score dynamically
  const calculateScore = () => {
    let score = 20 // Base score

    // Bio contribution
    if (profile.bio && profile.bio.trim().length > 10) score += 15

    // Stars contribution
    const stars = stats.total_stars || 0
    if (stars > 50) score += 25
    else if (stars > 10) score += 18
    else if (stars > 0) score += 10

    // Repos contribution
    const repos = stats.total_repos || 0
    if (repos > 20) score += 15
    else if (repos > 5) score += 10

    // Originality ratio contribution
    if (stats.original_repos && stats.total_repos) {
      const ratio = stats.original_repos / stats.total_repos
      if (ratio > 0.6) score += 10
    }

    // Followers contribution
    const followers = profile.followers || 0
    if (followers > 100) score += 15
    else if (followers > 10) score += 10
    else if (followers > 0) score += 5

    // Achievements unlocked
    if (achievements && achievements.length > 0) {
      const unlockedCount = achievements.filter(a => a.unlocked).length
      score += unlockedCount * 2.5
    }

    return Math.min(Math.round(score), 100)
  }

  const score = calculateScore()

  // Determine grade and label
  const getGradeInfo = (score) => {
    if (score >= 90) return { grade: 'A+', label: 'Elite Developer', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
    if (score >= 75) return { grade: 'A', label: 'Pro Developer', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
    if (score >= 60) return { grade: 'B', label: 'Rising Star', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
    if (score >= 40) return { grade: 'C', label: 'Active Builder', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
    return { grade: 'D', label: 'Fresh Starter', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
  }

  const gradeInfo = getGradeInfo(score)

  return (
    <motion.div
      className="card profile-strength-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.65 }}
    >
      <div className="card-header">
        <span className="card-header-icon">⚡</span>
        <div>
          <div className="card-header-title">Profile Strength Center</div>
          <div className="card-header-subtitle">AI analysis of GitHub portfolio optimization</div>
        </div>
      </div>

      <div className="strength-meter-wrap">
        <div className="strength-radial-box">
          <div className="strength-grade" style={{ color: gradeInfo.color, background: gradeInfo.bg }}>
            {gradeInfo.grade}
          </div>
          <div className="strength-label">{gradeInfo.label}</div>
        </div>

        <div className="strength-bar-box">
          <div className="strength-bar-header">
            <span className="strength-bar-title">Overall Score</span>
            <span className="strength-bar-val" style={{ color: gradeInfo.color }}>{score}%</span>
          </div>
          <div className="strength-bar-track">
            <motion.div
              className="strength-bar-fill"
              style={{ background: gradeInfo.color }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <p className="strength-verdict-text">
            {score >= 75 
              ? 'Your profile is highly optimized! Minor tweaks can make you stand out to elite tech recruiters.' 
              : 'Adding a comprehensive bio, creating original projects, and building star traction can quickly boost your grade.'}
          </p>
        </div>
      </div>

      {tips && tips.length > 0 && (
        <div className="strength-suggestions-box">
          <h4 className="strength-suggestions-title">💡 Actionable Optimization Steps</h4>
          <div className="strength-suggestions-list">
            {tips.map((tip, i) => (
              <div className="strength-suggestion-item" key={i}>
                <div className="suggestion-chk">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="suggestion-text">{tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
