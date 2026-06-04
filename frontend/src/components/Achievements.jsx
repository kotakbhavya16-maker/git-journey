import { motion } from 'framer-motion'

export default function Achievements({ achievements }) {
  if (!achievements || achievements.length === 0) return null

  const unlocked = achievements.filter((a) => a.unlocked).length

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <div className="card-header">
        <div>
          <div className="card-header-title">
            Achievements
          </div>
          <div className="card-header-subtitle">
            {unlocked} of {achievements.length} unlocked
          </div>
        </div>
      </div>

      <div className="achievements-grid">
        {achievements.map((badge, i) => {
          const progress = badge.unlocked
            ? 100
            : Math.min((badge.value / badge.target) * 100, 99)

          return (
            <motion.div
              key={badge.id}
              className={`achievement-badge ${badge.unlocked ? 'unlocked' : 'locked'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.7 + i * 0.06 }}
            >
              <div className="achievement-emoji">{badge.emoji}</div>
              <div className="achievement-name">{badge.name}</div>
              <div className="achievement-desc">{badge.description}</div>
              <div className="achievement-progress">
                <div
                  className="achievement-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
