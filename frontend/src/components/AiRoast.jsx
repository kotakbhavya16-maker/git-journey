import { motion } from 'framer-motion'

export default function AiRoast({ roast }) {
  if (!roast) return null

  return (
    <motion.div
      className="card roast-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="card-header">
        <span className="card-header-icon">🔥</span>
        <div>
          <div className="card-header-title">AI Roast</div>
          <div className="card-header-subtitle">Fun observations about your coding habits</div>
        </div>
      </div>

      {roast.overall_vibe && (
        <div className="roast-vibe">✨ {roast.overall_vibe}</div>
      )}

      <div className="roast-lines">
        {roast.lines &&
          roast.lines.map((line, i) => (
            <motion.div
              key={i}
              className="roast-bubble"
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.15 }}
            >
              {line}
            </motion.div>
          ))}
      </div>
    </motion.div>
  )
}
