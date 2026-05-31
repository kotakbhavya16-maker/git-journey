import { useState } from 'react'
import { motion } from 'framer-motion'
import RepoDeepDive from './RepoDeepDive'

const LANG_COLORS = {
  JavaScript: '#f1e05a', Python: '#3572A5', Java: '#b07219',
  TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#563d7c',
  'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  PHP: '#4F5D95', Ruby: '#701516', Go: '#00ADD8',
  Swift: '#F05138', Kotlin: '#A97BFF', Rust: '#dea584',
  Dart: '#00B4AB', Shell: '#89e051', Vue: '#41b883',
}

export default function TopRepos({ repos, username }) {
  const [selectedRepo, setSelectedRepo] = useState(null)

  if (!repos || repos.length === 0) return null

  return (
    <>
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <div className="card-header">
          <span className="card-header-icon">📦</span>
          <div>
            <div className="card-header-title">Top Repositories</div>
            <div className="card-header-subtitle">Click any repo to explore in detail</div>
          </div>
        </div>

        <div className="repos-grid">
          {repos.map((repo, i) => (
            <motion.div
              key={repo.name}
              className="repo-card"
              onClick={() => setSelectedRepo(repo.name)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.04 }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedRepo(repo.name)}
            >
              <div className="repo-card-header">
                <span className="repo-card-icon">
                  {repo.is_fork ? '🍴' : '📁'}
                </span>
                <span className="repo-card-name">{repo.name}</span>
              </div>

              {repo.description && (
                <p className="repo-card-desc">
                  {repo.description.length > 80
                    ? repo.description.slice(0, 80) + '...'
                    : repo.description}
                </p>
              )}

              <div className="repo-card-footer">
                {repo.language && (
                  <span className="repo-card-lang">
                    <span
                      className="repo-lang-dot"
                      style={{ background: LANG_COLORS[repo.language] || '#8b949e' }}
                    />
                    {repo.language}
                  </span>
                )}
                <span className="repo-card-stat">⭐ {repo.stars}</span>
                <span className="repo-card-stat">🍴 {repo.forks}</span>
              </div>

              {repo.topics && repo.topics.length > 0 && (
                <div className="repo-card-topics">
                  {repo.topics.slice(0, 3).map((t) => (
                    <span key={t} className="repo-topic-chip">{t}</span>
                  ))}
                </div>
              )}

              <div className="repo-card-click-hint">Click to explore →</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Deep Dive Modal */}
      {selectedRepo && (
        <RepoDeepDive
          username={username}
          repoName={selectedRepo}
          onClose={() => setSelectedRepo(null)}
        />
      )}
    </>
  )
}
