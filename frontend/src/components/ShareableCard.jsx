import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toPng } from 'html-to-image'

const CARD_THEMES = [
  { id: 'cosmic', name: '🌌 Cosmic Glass' },
  { id: 'cyberpunk', name: '👾 Cyberpunk Glitch' },
  { id: 'vaporwave', name: '🌅 Vaporwave Grid' },
  { id: 'matrix', name: '🟢 Matrix Terminal' },
  { id: 'gold', name: '✨ Golden Foil' },
  { id: 'professional', name: '💼 Executive Minimalist' },
  { id: 'slate', name: '💼 Minimal Slate' }
]

export default function ShareableCard({ profile, stats, languages, ai }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [themeIdx, setThemeIdx] = useState(0)

  // Card Studio Customization States
  const [showAvatar, setShowAvatar] = useState(true)
  const [showRank, setShowRank] = useState(true)
  const [showBio, setShowBio] = useState(true)
  const [showStack, setShowStack] = useState(true)
  const [showBarcode, setShowBarcode] = useState(true)
  const [customTitle, setCustomTitle] = useState('')

  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glowX, setGlowX] = useState(50)
  const [glowY, setGlowY] = useState(50)
  const [isHovered, setIsHovered] = useState(false)

  const currentTheme = CARD_THEMES[themeIdx]
  const personality = ai?.personality

  const getRank = () => {
    const stars = stats.total_stars
    const repos = stats.total_repos
    if (stars >= 100) return { title: 'S-CLASS LEGEND', color: '#ffbd2e', shadow: 'rgba(255,189,46,0.25)', rank: 'S' }
    if (stars >= 30 || repos >= 30) return { title: 'A-CLASS ELITE', color: '#bc8cff', shadow: 'rgba(188,140,255,0.25)', rank: 'A' }
    if (stars >= 5 || repos >= 10) return { title: 'B-CLASS PRO', color: '#58a6ff', shadow: 'rgba(88,166,255,0.25)', rank: 'B' }
    return { title: 'C-CLASS SPROUT', color: '#3fb950', shadow: 'rgba(63,185,80,0.25)', rank: 'C' }
  }

  const rankInfo = getRank()
  const displayTitle = customTitle.trim() || rankInfo.title
  const monogramLetter = (profile.name || profile.username || 'G').charAt(0).toUpperCase()

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const normX = (mouseX / width) - 0.5
    const normY = (mouseY / height) - 0.5
    
    const tiltMultiplier = currentTheme.id === 'cyberpunk' ? 26 : currentTheme.id === 'matrix' ? 8 : 20
    setRotateY(normX * tiltMultiplier)
    setRotateX(-normY * tiltMultiplier)
    
    setGlowX(mouseX / width * 100)
    setGlowY(mouseY / height * 100)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
  }

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: currentTheme.id === 'slate' ? '#f8fafc' : currentTheme.id === 'matrix' ? '#020202' : '#09090e',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      })
      const link = document.createElement('a')
      link.download = `gitjourney-${profile.username}-${currentTheme.id}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    }
    setDownloading(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://github.com/${profile.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <div className="card-header">
        <span className="card-header-icon">🎴</span>
        <div>
          <div className="card-header-title">Dev Card Studio</div>
          <div className="card-header-subtitle">Customize and download your 3D interactive coder badge</div>
        </div>
      </div>

      <div className="card-studio-layout">
        {/* Left Side: Card Preview */}
        <div className="card-studio-preview-pane">
          <div className="share-card-container" style={{ perspective: 1000 }}>
            <motion.div
              className="share-card-tilt-wrapper"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              animate={{
                rotateX: rotateX,
                rotateY: rotateY,
                scale: isHovered ? 1.02 : 1,
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              <div className={`share-card-inner card-theme-${currentTheme.id}`} ref={cardRef}>
                {/* Corner Tech Markings */}
                <div className="tech-corner tl" />
                <div className="tech-corner tr" />
                <div className="tech-corner bl" />
                <div className="tech-corner br" />

                {/* Custom Background Animations */}
                {currentTheme.id === 'cosmic' && (
                  <div className="theme-anim-cosmic">
                    <div className="nebula-particle p1" />
                    <div className="nebula-particle p2" />
                  </div>
                )}
                {currentTheme.id === 'cyberpunk' && (
                  <div className="theme-anim-cyberpunk">
                    <div className="cyber-laser" />
                  </div>
                )}
                {currentTheme.id === 'vaporwave' && (
                  <div className="theme-anim-vaporwave">
                    <div className="retro-grid" />
                  </div>
                )}
                {currentTheme.id === 'matrix' && (
                  <div className="theme-anim-matrix" />
                )}
                {currentTheme.id === 'gold' && (
                  <div className="theme-anim-gold">
                    <div className="gold-shimmer" />
                  </div>
                )}
                {currentTheme.id === 'professional' && (
                  <div className="theme-anim-professional">
                    <div className="professional-grid" />
                  </div>
                )}

                {/* Holographic Glare Overlay */}
                {isHovered && (
                  <div
                    className="share-card-glare"
                    style={{
                      background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 60%)`,
                    }}
                  />
                )}

                {/* Top row */}
                <div className="share-card-top-row">
                  <span className="share-card-logo">🐙 GITJOURNEY</span>
                  {showRank && (
                    <span
                      className="share-card-rank-badge"
                      style={{
                        borderColor: rankInfo.color,
                        color: rankInfo.color,
                        textShadow: `0 0 8px ${rankInfo.color}40`,
                        boxShadow: `0 0 10px ${rankInfo.shadow}`,
                        backgroundColor: `${rankInfo.color}0a`
                      }}
                    >
                      {displayTitle}
                    </span>
                  )}
                </div>

                {/* Profile Avatar and Info */}
                <div className="share-card-profile-section">
                  <div
                    className="share-card-avatar-container"
                    style={{
                      boxShadow: `0 0 15px ${rankInfo.shadow}`,
                    }}
                  >
                    {showAvatar ? (
                      <img
                        className="share-card-avatar"
                        src={profile.avatar}
                        alt={profile.name}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="share-card-avatar-placeholder">
                        {monogramLetter}
                      </div>
                    )}
                    <div
                      className="share-card-rank-letter"
                      style={{
                        backgroundColor: rankInfo.color,
                        boxShadow: `0 0 8px ${rankInfo.shadow}`
                      }}
                    >
                      {rankInfo.rank}
                    </div>
                  </div>

                  <div className="share-card-user-details">
                    <div className="share-card-name">{profile.name}</div>
                    <div className="share-card-username">@{profile.username}</div>
                    {showBio && personality && (
                      <div className="share-card-personality">
                        {personality.emoji} {personality.type_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="share-card-stats">
                  <div className="share-card-stat">
                    <div className="share-card-stat-value">{stats.total_repos}</div>
                    <div className="share-card-stat-label">Repos</div>
                  </div>
                  <div className="share-card-stat">
                    <div className="share-card-stat-value">{stats.total_stars}</div>
                    <div className="share-card-stat-label">Stars</div>
                  </div>
                  <div className="share-card-stat">
                    <div className="share-card-stat-value">{profile.followers}</div>
                    <div className="share-card-stat-label">Followers</div>
                  </div>
                </div>

                {/* Languages Stack */}
                {showStack && languages && languages.length > 0 && (
                  <div className="share-card-languages-container">
                    <div className="share-card-section-label">PRIMARY WEAPONS</div>
                    <div className="share-card-langs">
                      {languages.slice(0, 4).map((lang) => (
                        <span className="share-card-lang-chip" key={lang.name}>
                          {lang.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Barcode */}
                <div className="share-card-footer">
                  {showBarcode ? (
                    <div className="share-card-barcode">
                      <div className="barcode-line" style={{ width: '2px' }} />
                      <div className="barcode-line" style={{ width: '4px' }} />
                      <div className="barcode-line" style={{ width: '1px' }} />
                      <div className="barcode-line" style={{ width: '3px' }} />
                      <div className="barcode-line" style={{ width: '1px' }} />
                      <div className="barcode-line" style={{ width: '5px' }} />
                      <div className="barcode-line" style={{ width: '2px' }} />
                      <div className="barcode-line" style={{ width: '1px' }} />
                      <div className="barcode-line" style={{ width: '4px' }} />
                    </div>
                  ) : (
                    <div style={{ flex: 1 }} />
                  )}
                  <div className="share-card-url">gitjourney.dev/{profile.username}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Studio Control Panel */}
        <div className="card-studio-controls">
          <h3 className="studio-control-title">🎨 Card Themes</h3>
          <div className="studio-theme-grid">
            {CARD_THEMES.map((t, idx) => (
              <button
                key={t.id}
                className={`studio-theme-btn ${themeIdx === idx ? 'active' : ''}`}
                onClick={() => setThemeIdx(idx)}
              >
                {t.name}
              </button>
            ))}
          </div>

          <h3 className="studio-control-title">⚙️ Card Elements</h3>
          <div className="studio-options-list">
            <label className="studio-option-row">
              <span>Show Github Avatar</span>
              <input
                type="checkbox"
                checked={showAvatar}
                onChange={(e) => setShowAvatar(e.target.checked)}
              />
            </label>

            <label className="studio-option-row">
              <span>Show Rank Badge</span>
              <input
                type="checkbox"
                checked={showRank}
                onChange={(e) => setShowRank(e.target.checked)}
              />
            </label>

            <label className="studio-option-row">
              <span>Show Developer Persona</span>
              <input
                type="checkbox"
                checked={showBio}
                onChange={(e) => setShowBio(e.target.checked)}
              />
            </label>

            <label className="studio-option-row">
              <span>Show Language Stack</span>
              <input
                type="checkbox"
                checked={showStack}
                onChange={(e) => setShowStack(e.target.checked)}
              />
            </label>

            <label className="studio-option-row">
              <span>Show Design Barcode</span>
              <input
                type="checkbox"
                checked={showBarcode}
                onChange={(e) => setShowBarcode(e.target.checked)}
              />
            </label>
          </div>

          <h3 className="studio-control-title">✏️ Custom Badge Title</h3>
          <input
            type="text"
            className="studio-text-input"
            placeholder={`e.g. ${rankInfo.title}`}
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            maxLength={18}
          />

          <div className="studio-actions">
            <button
              className="share-btn share-btn-primary"
              onClick={handleDownload}
              disabled={downloading}
              style={{ width: '100%' }}
            >
              {downloading ? '⏳ Rendering...' : '📥 Download PNG'}
            </button>
            <button
              className="share-btn share-btn-secondary"
              onClick={handleCopyLink}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {copied ? '✅ Link Copied!' : '🔗 Copy Profile Link'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
