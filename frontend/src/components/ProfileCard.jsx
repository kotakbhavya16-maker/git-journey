import { motion } from 'framer-motion'

export default function ProfileCard({ profile, stats }) {
  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown'

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-ring" />
          <img
            className="profile-avatar"
            src={profile.avatar}
            alt={profile.name}
            loading="lazy"
          />
        </div>

        <div className="profile-info">
          <h2 className="profile-name">{profile.name}</h2>
          <div className="profile-username">@{profile.username}</div>
          
          {profile.bio && (
            <p className="profile-bio">{profile.bio}</p>
          )}

          <div className="profile-meta">
            {profile.location && profile.location !== 'Unknown' && (
              <span className="profile-meta-item">📍 {profile.location}</span>
            )}
            {profile.company && (
              <span className="profile-meta-item">🏢 {profile.company}</span>
            )}
            <span className="profile-meta-item">📅 Joined {joinDate}</span>
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <div className="profile-stat-value">{stats.total_repos}</div>
              <div className="profile-stat-label">Repos</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{stats.total_stars}</div>
              <div className="profile-stat-label">Stars</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{profile.followers}</div>
              <div className="profile-stat-label">Followers</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{stats.total_languages}</div>
              <div className="profile-stat-label">Languages</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{stats.account_age_years}y</div>
              <div className="profile-stat-label">On GitHub</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
