import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function PortfolioBuilder({ githubData }) {
  const [downloaded, setDownloaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef(null)

  const profile = githubData?.profile || {}
  const stats = githubData?.stats || {}
  const languages = githubData?.languages || []
  const repos = githubData?.repos_summary || []
  const timeline = githubData?.timeline || []

  // Generate the standalone HTML template
  const generatePortfolioHtml = () => {
    const topLangsList = languages.slice(0, 5).map(l => `
      <div class="skill-item">
        <div class="skill-info">
          <span>${l.name}</span>
          <span>${l.percentage}%</span>
        </div>
        <div class="skill-bar-track">
          <div class="skill-bar-fill" style="width: ${l.percentage}%"></div>
        </div>
      </div>
    `).join('')

    const reposList = repos.slice(0, 6).map(r => `
      <a href="${r.url || '#'}" target="_blank" class="repo-card">
        <div class="repo-header">
          <span class="repo-icon">📁</span>
          <span class="repo-name">${r.name}</span>
        </div>
        <p class="repo-desc">${r.description || 'No description provided.'}</p>
        <div class="repo-footer">
          <span>⭐ ${r.stars || 0}</span>
          <span>🍴 ${r.forks || 0}</span>
          <span class="repo-lang">${r.language || 'N/A'}</span>
        </div>
      </a>
    `).join('')

    const timelineItems = timeline.slice(-5).map(t => `
      <div class="timeline-step">
        <div class="timeline-dot"></div>
        <div class="timeline-date">${t.year}</div>
        <div class="timeline-content">
          <h4>${t.repos} Repositories Shipped</h4>
        </div>
      </div>
    `).join('')

    const name = profile.name || profile.username
    const bio = profile.bio || 'Professional Software Engineer'
    const location = profile.location && profile.location !== 'Unknown' ? `📍 ${profile.location}` : ''
    const blog = profile.blog ? `<a href="${profile.blog.startsWith('http') ? profile.blog : 'https://' + profile.blog}" target="_blank" class="social-link">🌐 Website</a>` : ''
    const githubLink = `https://github.com/${profile.username}`

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #151d30;
      --border: #233153;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --primary-glow: rgba(59, 130, 246, 0.15);
      --accent: #6366f1;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      line-height: 1.6;
      overflow-x: hidden;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
    }

    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, var(--card-bg) 0%, rgba(21, 29, 48, 0.7) 100%);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 3rem 2rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 2.5rem;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
      pointer-events: none;
    }

    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 3px solid var(--primary);
      box-shadow: 0 0 20px var(--primary-glow);
      object-fit: cover;
    }

    .hero-details h1 {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 0.5rem;
      background: linear-gradient(to right, #fff, var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-details .username {
      font-family: 'JetBrains Mono', monospace;
      color: var(--primary);
      font-size: 1rem;
      margin-bottom: 0.75rem;
      display: block;
    }

    .hero-details .bio {
      color: var(--text-muted);
      font-size: 1.1rem;
      margin-bottom: 1.25rem;
      max-width: 600px;
    }

    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      align-items: center;
    }

    .social-link {
      color: var(--text);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      padding: 0.4rem 1rem;
      border-radius: 50px;
      transition: all 0.2s ease;
    }

    .social-link:hover {
      border-color: var(--primary);
      box-shadow: 0 0 10px var(--primary-glow);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 15px;
      padding: 1.5rem;
      text-align: center;
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-value {
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--primary);
      line-height: 1;
      margin-bottom: 0.35rem;
    }

    .stat-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* Content Grid */
    .section-title {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    /* Repositories */
    .repos-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .repo-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 15px;
      padding: 1.5rem;
      text-decoration: none;
      color: var(--text);
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: all 0.2s ease;
    }

    .repo-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 15px var(--primary-glow);
    }

    .repo-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .repo-name {
      font-weight: 600;
      font-size: 1.05rem;
    }

    .repo-desc {
      color: var(--text-muted);
      font-size: 0.88rem;
      margin-bottom: 1.25rem;
      flex: 1;
    }

    .repo-footer {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    .repo-lang {
      margin-left: auto;
      background: rgba(255,255,255,0.05);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }

    /* Skills & Tech Stack */
    .skills-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 1.75rem;
      height: fit-content;
    }

    .skill-item {
      margin-bottom: 1.25rem;
    }

    .skill-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }

    .skill-bar-track {
      width: 100%;
      height: 6px;
      background-color: rgba(255,255,255,0.05);
      border-radius: 10px;
      overflow: hidden;
    }

    .skill-bar-fill {
      height: 100%;
      background: linear-gradient(to right, var(--primary), var(--accent));
      border-radius: 10px;
    }

    /* Timeline */
    .timeline-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 1.75rem;
      margin-top: 1.5rem;
    }

    .timeline-steps {
      position: relative;
      padding-left: 1.5rem;
      margin-top: 1rem;
    }

    .timeline-steps::before {
      content: '';
      position: absolute;
      left: 3px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--border);
    }

    .timeline-step {
      position: relative;
      margin-bottom: 1.5rem;
    }

    .timeline-step:last-child {
      margin-bottom: 0;
    }

    .timeline-dot {
      position: absolute;
      left: -23px;
      top: 6px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--primary);
      box-shadow: 0 0 8px var(--primary);
    }

    .timeline-date {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--primary);
      font-weight: 600;
      margin-bottom: 0.15rem;
    }

    .timeline-content h4 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text);
    }

    /* Footer */
    footer {
      text-align: center;
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    @media (max-width: 768px) {
      .hero {
        flex-direction: column;
        text-align: center;
        padding: 2rem 1.5rem;
      }
      .main-grid {
        grid-template-columns: 1fr;
      }
      .hero-meta {
        justify-content: center;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HERO -->
    <header class="hero">
      <div class="avatar-wrapper">
        <img class="avatar" src="${profile.avatar}" alt="${name}">
      </div>
      <div class="hero-details">
        <h1>${name}</h1>
        <span class="username">@${profile.username}</span>
        <p class="bio">${bio}</p>
        <div class="hero-meta">
          <span class="social-link" style="border-color:transparent">${location || 'Global Developer'}</span>
          <a href="${githubLink}" target="_blank" class="social-link">🐙 Github</a>
          ${blog}
        </div>
      </div>
    </header>

    <!-- STATS -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.total_repos || 0}</div>
        <div class="stat-label">Repositories</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.total_stars || 0}</div>
        <div class="stat-label">Stars</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${profile.followers || 0}</div>
        <div class="stat-label">Followers</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.total_languages || 0}</div>
        <div class="stat-label">Technologies</div>
      </div>
    </section>

    <!-- MAIN GRID -->
    <div class="main-grid">
      <!-- Left side: Repos -->
      <main>
        <h2 class="section-title">📂 Featured Projects</h2>
        <div class="repos-section">
          ${reposList}
        </div>
      </main>

      <!-- Right side: Skills & Timeline -->
      <aside>
        <div class="skills-card">
          <h2 class="section-title" style="font-size:1.2rem; margin-bottom:1.25rem;">💻 Primary Skills</h2>
          ${topLangsList}
        </div>

        <div class="timeline-card">
          <h2 class="section-title" style="font-size:1.2rem; margin-bottom:1.25rem;">📈 Code Evolution</h2>
          <div class="timeline-steps">
            ${timelineItems}
          </div>
        </div>
      </aside>
    </div>

    <!-- FOOTER -->
    <footer>
      <p>Generated via GitJourney · Powered by GitHub API</p>
    </footer>
  </div>
</body>
</html>`
  }

  // Handle building and downloading the portfolio HTML
  const handleDownload = () => {
    try {
      const htmlContent = generatePortfolioHtml()
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `portfolio-${profile.username || 'developer'}.html`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)
    } catch (err) {
      console.error('Failed to download portfolio:', err)
    }
  }

  // Handle copying code directly
  const handleCopyCode = () => {
    try {
      const htmlContent = generatePortfolioHtml()
      navigator.clipboard.writeText(htmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy portfolio code:', err)
    }
  }

  // Render iframe preview when component mounts or data updates
  useEffect(() => {
    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(generatePortfolioHtml())
      iframeDoc.close()
    }
  }, [githubData])

  return (
    <motion.div
      className="card portfolio-builder-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.75 }}
    >
      <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="card-header-icon">🌐</span>
          <div>
            <div className="card-header-title">Dev Portfolio Generator</div>
            <div className="card-header-subtitle">Create a hostable single-page portfolio with your live GitHub metrics</div>
          </div>
        </div>
      </div>

      <div className="portfolio-builder-content">
        {/* Left Side: Live Preview Pane */}
        <div className="portfolio-preview-pane">
          <div className="preview-header-bar">
            <span class="preview-dot dot-red"></span>
            <span class="preview-dot dot-yellow"></span>
            <span class="preview-dot dot-green"></span>
            <span class="preview-address-bar">portfolio-${profile.username || 'developer'}.html</span>
          </div>
          <iframe
            ref={iframeRef}
            className="portfolio-preview-iframe"
            title="Portfolio HTML Preview"
          />
        </div>

        {/* Right Side: Builder Control Options */}
        <div className="portfolio-controls-pane">
          <div className="builder-info-box">
            <h4>🚀 Hosting instructions:</h4>
            <ol>
              <li>Download the portfolio `.html` file.</li>
              <li>Rename the file to `index.html`.</li>
              <li>Upload it to a free hosting service like **Netlify**, **Vercel**, or **GitHub Pages**.</li>
              <li>Enjoy your instantly deployed developer portfolio site!</li>
            </ol>
          </div>

          <div className="builder-actions">
            <button
              className="share-btn share-btn-primary"
              onClick={handleDownload}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              <span>📥</span> {downloaded ? 'Downloaded Portfolio!' : 'Download Portfolio HTML'}
            </button>
            <button
              className="share-btn share-btn-secondary"
              onClick={handleCopyCode}
              style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              <span>📋</span> {copied ? 'Code Copied!' : 'Copy Source Code'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
