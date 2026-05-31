import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts'

export default function CommitActivity({ contributions }) {
  const [tab, setTab] = useState('hourly') // 'hourly' | 'weekly'

  if (!contributions || !contributions.hourly || !contributions.weekly) return null

  const { hourly, weekly } = contributions

  return (
    <motion.div
      className="card commit-activity-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="card-header-icon">⏰</span>
          <div>
            <div className="card-header-title">Commit Activity Peaks</div>
            <div className="card-header-subtitle">When this developer is most active</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button
            className={`tab-switch-btn ${tab === 'hourly' ? 'active' : ''}`}
            onClick={() => setTab('hourly')}
          >
            Hourly
          </button>
          <button
            className={`tab-switch-btn ${tab === 'weekly' ? 'active' : ''}`}
            onClick={() => setTab('weekly')}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="chart-container" style={{ width: '100%', height: 220, marginTop: '1rem' }}>
        {tab === 'hourly' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourly} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="hourlyColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
                formatter={(value) => [`${value} commits`, 'Count']}
              />
              <Area
                type="monotone"
                dataKey="commits"
                stroke="var(--accent-cyan)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#hourlyColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
                formatter={(value) => [`${value} commits`, 'Count']}
              />
              <Bar
                dataKey="commits"
                fill="var(--accent-purple)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  )
}
