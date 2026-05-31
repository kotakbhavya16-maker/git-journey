import { motion } from 'framer-motion'

const LEVEL_COLORS = [
  'var(--heatmap-0)',  // no activity
  'var(--heatmap-1)',  // low
  'var(--heatmap-2)',  // medium
  'var(--heatmap-3)',  // high
  'var(--heatmap-4)',  // very high
]

function getLevel(count, maxDaily) {
  if (count === 0) return 0
  if (maxDaily <= 0) return 1
  const ratio = count / maxDaily
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export default function ContributionHeatmap({ contributions }) {
  if (!contributions || !contributions.heatmap) return null

  const { heatmap, total_contributions, active_days, max_daily } = contributions

  // Group by week columns (7 rows × ~13 columns)
  const weeks = []
  let currentWeek = []

  // Pad the first week so Monday = row 0
  const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
  const firstDayIdx = dayMap[heatmap[0]?.day] || 0
  for (let i = 0; i < firstDayIdx; i++) {
    currentWeek.push(null) // empty padding
  }

  for (const cell of heatmap) {
    currentWeek.push(cell)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  // Month labels
  const monthLabels = []
  let lastMonth = ''
  weeks.forEach((week, wIdx) => {
    const firstCell = week.find((c) => c !== null)
    if (firstCell) {
      const month = new Date(firstCell.date).toLocaleString('en', { month: 'short' })
      if (month !== lastMonth) {
        monthLabels.push({ month, wIdx })
        lastMonth = month
      }
    }
  })

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="card-header">
        <span className="card-header-icon">📊</span>
        <div>
          <div className="card-header-title">Contribution Heatmap</div>
          <div className="card-header-subtitle">
            {total_contributions} contributions in the last 365 days
            {active_days > 0 && ` · ${active_days} active days`}
          </div>
        </div>
      </div>

      <div className="heatmap-container">
        {/* Month labels */}
        <div
          className="heatmap-months"
          style={{
            gridTemplateColumns: `35px repeat(${weeks.length}, 10px)`,
            gap: '3px',
          }}
        >
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="heatmap-month-label"
              style={{ gridColumnStart: m.wIdx + 2 }}
            >
              {m.month}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="heatmap-grid-wrap">
          {/* Day labels */}
          <div className="heatmap-day-labels">
            <span></span>
            <span>Mon</span>
            <span></span>
            <span>Wed</span>
            <span></span>
            <span>Fri</span>
            <span></span>
          </div>

          {/* Cells grid */}
          <div
            className="heatmap-grid"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, 10px)`,
              gap: '3px',
            }}
          >
            {weeks.map((week, wIdx) =>
              week.map((cell, dIdx) => {
                if (!cell) {
                  return (
                    <div key={`${wIdx}-${dIdx}`} className="heatmap-cell empty" />
                  )
                }
                const level = getLevel(cell.count, max_daily)
                return (
                  <motion.div
                    key={`${wIdx}-${dIdx}`}
                    className="heatmap-cell"
                    style={{ backgroundColor: LEVEL_COLORS[level] }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 0.2,
                      delay: 0.3 + wIdx * 0.015,
                    }}
                    title={`${cell.date}: ${cell.count} contribution${cell.count !== 1 ? 's' : ''}`}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span className="heatmap-legend-label">Less</span>
          {LEVEL_COLORS.map((color, i) => (
            <div
              key={i}
              className="heatmap-cell legend-cell"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="heatmap-legend-label">More</span>
        </div>
      </div>
    </motion.div>
  )
}
