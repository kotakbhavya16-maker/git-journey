import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = [
  '#58a6ff', '#bc8cff', '#3fb950', '#f0883e', '#f85149',
  '#f778ba', '#d29922', '#79c0ff', '#a5d6ff', '#7ee787',
]

export default function LanguageChart({ languages }) {
  if (!languages || languages.length === 0) return null

  const chartData = languages.slice(0, 8).map((lang) => ({
    name: lang.name,
    value: lang.count,
    percentage: lang.percentage,
  }))

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="card-header">
        <span className="card-header-icon">💻</span>
        <div>
          <div className="card-header-title">Language Breakdown</div>
          <div className="card-header-subtitle">Top languages across all repositories</div>
        </div>
      </div>

      <div className="language-section">
        <div className="language-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1c2333',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  color: '#e6edf3',
                  fontSize: '0.8rem',
                  fontFamily: 'Inter, sans-serif',
                }}
                formatter={(value, name) => [`${value} repos`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="language-list">
          {languages.slice(0, 7).map((lang, i) => (
            <div className="language-item" key={lang.name}>
              <div
                className="language-dot"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="language-name">{lang.name}</span>
              <div className="language-bar-bg">
                <motion.div
                  className="language-bar-fill"
                  style={{ background: COLORS[i % COLORS.length] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${lang.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                />
              </div>
              <span className="language-percent">{lang.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
