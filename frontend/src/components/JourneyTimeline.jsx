import { motion } from 'framer-motion'

export default function JourneyTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) return null

  const maxRepos = Math.max(...timeline.map((t) => t.repos), 1)

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="card-header">
        <span className="card-header-icon">🎬</span>
        <div>
          <div className="card-header-title">Coding Journey</div>
          <div className="card-header-subtitle">Repositories created per year</div>
        </div>
      </div>

      <div className="timeline-bars">
        {timeline.map((item, i) => {
          const height = Math.max((item.repos / maxRepos) * 100, 3)
          return (
            <div className="timeline-bar-group" key={item.year}>
              <span className="timeline-bar-count">
                {item.repos > 0 ? item.repos : ''}
              </span>
              <motion.div
                className="timeline-bar"
                style={{ height: `${height}%` }}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
                title={`${item.year}: ${item.repos} repos`}
              />
              <span className="timeline-bar-year">{item.year}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
