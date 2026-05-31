import { motion } from 'framer-motion'

export default function DevPersonality({ personality }) {
  if (!personality) return null

  return (
    <motion.div
      className="card personality-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="personality-bg-glow" />

      <div className="card-header" style={{ justifyContent: 'center' }}>
        <span className="card-header-icon">🧬</span>
        <div className="card-header-title">Developer DNA</div>
      </div>

      <div className="personality-emoji">{personality.emoji || '🚀'}</div>

      <h3 className="personality-type">
        {personality.type_name || 'The Code Explorer'}
      </h3>

      <p className="personality-desc">
        {personality.description || 'A passionate developer on a coding journey.'}
      </p>

      {personality.traits && personality.traits.length > 0 && (
        <div className="personality-traits">
          {personality.traits.map((trait, i) => (
            <div className="trait-item" key={trait.name}>
              <div className="trait-header">
                <span className="trait-name">{trait.name}</span>
                <span className="trait-score">{trait.score}/100</span>
              </div>
              <div className="trait-bar-bg">
                <motion.div
                  className="trait-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${trait.score}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                />
              </div>
              <span className="trait-label">{trait.label}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
