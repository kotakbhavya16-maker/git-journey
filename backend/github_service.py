"""
github_service.py — Fetches public GitHub profile data using GitHub REST API.
No authentication required for public data.
"""

import requests
from datetime import datetime, timedelta
from collections import defaultdict

GITHUB_API = "https://api.github.com"

def get_headers(token=None):
    import os
    if not token or token in ("undefined", "null", "your_github_token_here", ""):
        token = os.getenv("GITHUB_TOKEN", "")
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token and token not in ("your_github_token_here", ""):
        headers["Authorization"] = f"token {token}"
    return headers


def fetch_authenticated_username(headers):
    """Get username of the authenticated token."""
    if "Authorization" not in headers:
        return None
    try:
        response = requests.get(f"{GITHUB_API}/user", headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json().get("login")
    except Exception:
        pass
    return None


def fetch_user_profile(username, token=None):
    """Fetch basic user profile info."""
    headers = get_headers(token)
    response = requests.get(
        f"{GITHUB_API}/users/{username}",
        headers=headers,
        timeout=10
    )

    if response.status_code == 404:
        return None
    response.raise_for_status()

    data = response.json()
    return {
        "username": data.get("login", ""),
        "name": data.get("name", data.get("login", "")),
        "avatar": data.get("avatar_url", ""),
        "bio": data.get("bio", "No bio yet"),
        "location": data.get("location", "Unknown"),
        "company": data.get("company", None),
        "blog": data.get("blog", None),
        "twitter": data.get("twitter_username", None),
        "public_repos": data.get("public_repos", 0),
        "followers": data.get("followers", 0),
        "following": data.get("following", 0),
        "created_at": data.get("created_at", ""),
        "updated_at": data.get("updated_at", ""),
    }


def fetch_user_repos(username, max_pages=5, token=None):
    """Fetch all repos (paginated, includes private repos if owner token matches searched username)."""
    all_repos = []
    headers = get_headers(token)

    # Determine if searching for self to unlock private repositories
    auth_user = fetch_authenticated_username(headers)
    is_self = auth_user and auth_user.lower() == username.lower()

    endpoint = f"{GITHUB_API}/user/repos" if is_self else f"{GITHUB_API}/users/{username}/repos"

    for page in range(1, max_pages + 1):
        params = {
            "per_page": 100,
            "page": page,
            "sort": "created",
            "direction": "desc"
        }
        if is_self:
            params["visibility"] = "all"

        response = requests.get(
            endpoint,
            params=params,
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        repos = response.json()

        if not repos:
            break

        for repo in repos:
            all_repos.append({
                "name": repo.get("name", ""),
                "description": repo.get("description", ""),
                "language": repo.get("language", None),
                "stars": repo.get("stargazers_count", 0),
                "forks": repo.get("forks_count", 0),
                "watchers": repo.get("watchers_count", 0),
                "size": repo.get("size", 0),
                "is_fork": repo.get("fork", False),
                "created_at": repo.get("created_at", ""),
                "updated_at": repo.get("updated_at", ""),
                "pushed_at": repo.get("pushed_at", ""),
                "has_readme": repo.get("has_wiki", False),  # approximation
                "topics": repo.get("topics", []),
                "homepage": repo.get("homepage", None),
                "open_issues": repo.get("open_issues_count", 0),
            })

    return all_repos


def fetch_user_events(username, max_pages=3, token=None):
    """Fetch recent public events for contribution heatmap (last ~90 days)."""
    all_events = []
    headers = get_headers(token)

    for page in range(1, max_pages + 1):
        try:
            response = requests.get(
                f"{GITHUB_API}/users/{username}/events/public",
                params={"per_page": 100, "page": page},
                headers=headers,
                timeout=10
            )
            if response.status_code != 200:
                break
            events = response.json()
            if not events:
                break
            all_events.extend(events)
        except Exception:
            break

    # Aggregate events by date, hour, and day of week
    date_counts = defaultdict(int)
    event_types = defaultdict(int)
    hourly_activity = defaultdict(int)
    weekly_activity = defaultdict(int)

    for event in all_events:
        created = event.get("created_at", "")
        if created:
            date_str = created[:10]  # YYYY-MM-DD
            date_counts[date_str] += 1
            event_type = event.get("type", "Unknown")
            event_types[event_type] += 1

            # Parse hour and day of week
            try:
                dt = datetime.strptime(created, "%Y-%m-%dT%H:%M:%SZ")
                hourly_activity[dt.hour] += 1
                weekly_activity[dt.weekday()] += 1
            except Exception:
                pass

    # Build heatmap data for last 365 days
    today = datetime.utcnow().date()
    heatmap = []
    for i in range(365, -1, -1):
        d = today - timedelta(days=i)
        date_str = d.strftime("%Y-%m-%d")
        heatmap.append({
            "date": date_str,
            "count": date_counts.get(date_str, 0),
            "day": d.strftime("%a"),  # Mon, Tue...
            "week": d.isocalendar()[1],
        })

    total_contributions = sum(date_counts.values())
    active_days = len([d for d in date_counts.values() if d > 0])

    # Format hourly and weekly data for Recharts
    hourly = [{"hour": f"{h:02d}:00", "commits": hourly_activity[h]} for h in range(24)]
    days_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly = [{"day": days_map[d], "commits": weekly_activity[d]} for d in range(7)]

    return {
        "heatmap": heatmap,
        "total_contributions": total_contributions,
        "active_days": active_days,
        "event_types": dict(event_types),
        "max_daily": max(date_counts.values()) if date_counts else 0,
        "hourly": hourly,
        "weekly": weekly,
    }


def fetch_repo_details(username, repo_name, token=None):
    """Fetch detailed info about a specific repository."""
    headers = get_headers(token)

    # Basic repo info
    try:
        res = requests.get(
            f"{GITHUB_API}/repos/{username}/{repo_name}",
            headers=headers, timeout=10
        )
        if res.status_code != 200:
            return None
        repo = res.json()
    except Exception:
        return None

    # Languages breakdown
    languages = {}
    try:
        lang_res = requests.get(
            f"{GITHUB_API}/repos/{username}/{repo_name}/languages",
            headers=headers, timeout=10
        )
        if lang_res.status_code == 200:
            lang_data = lang_res.json()
            total_bytes = sum(lang_data.values()) or 1
            languages = [
                {"name": lang, "bytes": b, "percentage": round(b / total_bytes * 100, 1)}
                for lang, b in sorted(lang_data.items(), key=lambda x: x[1], reverse=True)
            ]
    except Exception:
        languages = []

    # Contributors (top 5)
    contributors = []
    try:
        contrib_res = requests.get(
            f"{GITHUB_API}/repos/{username}/{repo_name}/contributors",
            params={"per_page": 5},
            headers=headers, timeout=10
        )
        if contrib_res.status_code == 200:
            for c in contrib_res.json():
                contributors.append({
                    "username": c.get("login", ""),
                    "avatar": c.get("avatar_url", ""),
                    "contributions": c.get("contributions", 0),
                })
    except Exception:
        pass

    # Recent commits (last 5)
    recent_commits = []
    try:
        commits_res = requests.get(
            f"{GITHUB_API}/repos/{username}/{repo_name}/commits",
            params={"per_page": 5},
            headers=headers, timeout=10
        )
        if commits_res.status_code == 200:
            for cm in commits_res.json():
                commit = cm.get("commit", {})
                recent_commits.append({
                    "message": commit.get("message", "")[:100],
                    "date": commit.get("author", {}).get("date", ""),
                    "author": commit.get("author", {}).get("name", ""),
                })
    except Exception:
        pass

    return {
        "name": repo.get("name", ""),
        "full_name": repo.get("full_name", ""),
        "description": repo.get("description", ""),
        "language": repo.get("language"),
        "stars": repo.get("stargazers_count", 0),
        "forks": repo.get("forks_count", 0),
        "watchers": repo.get("watchers_count", 0),
        "open_issues": repo.get("open_issues_count", 0),
        "size": repo.get("size", 0),
        "default_branch": repo.get("default_branch", "main"),
        "created_at": repo.get("created_at", ""),
        "updated_at": repo.get("updated_at", ""),
        "pushed_at": repo.get("pushed_at", ""),
        "html_url": repo.get("html_url", ""),
        "homepage": repo.get("homepage", ""),
        "topics": repo.get("topics", []),
        "is_fork": repo.get("fork", False),
        "has_wiki": repo.get("has_wiki", False),
        "license": repo.get("license", {}).get("name") if repo.get("license") else None,
        "languages": languages,
        "contributors": contributors,
        "recent_commits": recent_commits,
    }


def analyze_github_data(profile, repos):
    """Process raw GitHub data into meaningful analytics."""

    # Filter out forked repos for original work analysis
    original_repos = [r for r in repos if not r["is_fork"]]

    # --- Language Breakdown ---
    language_count = {}
    for repo in original_repos:
        lang = repo["language"]
        if lang:
            language_count[lang] = language_count.get(lang, 0) + 1

    total_lang_repos = sum(language_count.values()) or 1
    languages = [
        {"name": lang, "count": count, "percentage": round(count / total_lang_repos * 100, 1)}
        for lang, count in sorted(language_count.items(), key=lambda x: x[1], reverse=True)
    ]

    # --- Timeline (repos per year) ---
    year_count = {}
    for repo in original_repos:
        if repo["created_at"]:
            year = repo["created_at"][:4]
            year_count[year] = year_count.get(year, 0) + 1

    # Fill in missing years
    if year_count:
        min_year = int(min(year_count.keys()))
        max_year = int(max(year_count.keys()))
        timeline = [
            {"year": str(y), "repos": year_count.get(str(y), 0)}
            for y in range(min_year, max_year + 1)
        ]
    else:
        timeline = []

    # --- Stats ---
    total_stars = sum(r["stars"] for r in repos)
    total_forks = sum(r["forks"] for r in repos)
    top_repo = max(repos, key=lambda r: r["stars"]) if repos else None

    # Account age
    if profile["created_at"]:
        join_date = datetime.strptime(profile["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        account_age_days = (datetime.utcnow() - join_date).days
        account_age_years = round(account_age_days / 365, 1)
    else:
        account_age_days = 0
        account_age_years = 0

    # --- Achievements ---
    achievements = calculate_achievements(profile, repos, original_repos, total_stars, languages, account_age_years)

    return {
        "profile": profile,
        "stats": {
            "total_repos": len(repos),
            "original_repos": len(original_repos),
            "forked_repos": len(repos) - len(original_repos),
            "total_stars": total_stars,
            "total_forks": total_forks,
            "total_languages": len(languages),
            "account_age_years": account_age_years,
            "account_age_days": account_age_days,
        },
        "languages": languages[:10],  # Top 10 languages
        "timeline": timeline,
        "top_repo": {
            "name": top_repo["name"],
            "stars": top_repo["stars"],
            "language": top_repo["language"],
            "description": top_repo["description"],
        } if top_repo else None,
        "achievements": achievements,
        "repos_summary": [
            {
                "name": r["name"],
                "stars": r["stars"],
                "forks": r["forks"],
                "language": r["language"],
                "description": r["description"] or "",
                "updated_at": r["updated_at"],
                "is_fork": r["is_fork"],
                "topics": r.get("topics", []),
            }
            for r in sorted(repos, key=lambda x: x["stars"], reverse=True)[:12]
        ],
    }


def calculate_achievements(profile, repos, original_repos, total_stars, languages, account_age_years):
    """Calculate which achievement badges the user has unlocked."""
    achievements = []

    # Star Collector — 50+ total stars
    achievements.append({
        "id": "star_collector",
        "name": "Star Collector",
        "emoji": "🌟",
        "description": "Earned 50+ total stars",
        "unlocked": total_stars >= 50,
        "value": total_stars,
        "target": 50,
    })

    # Streak Master — 3+ years active
    achievements.append({
        "id": "streak_master",
        "name": "Streak Master",
        "emoji": "🔥",
        "description": "Active for 3+ years on GitHub",
        "unlocked": account_age_years >= 3,
        "value": account_age_years,
        "target": 3,
    })

    # Polyglot — 5+ languages
    achievements.append({
        "id": "polyglot",
        "name": "Polyglot",
        "emoji": "🗣️",
        "description": "Used 5+ programming languages",
        "unlocked": len(languages) >= 5,
        "value": len(languages),
        "target": 5,
    })

    # Community Leader — 100+ followers
    achievements.append({
        "id": "community_leader",
        "name": "Community Leader",
        "emoji": "👥",
        "description": "Gained 100+ followers",
        "unlocked": profile["followers"] >= 100,
        "value": profile["followers"],
        "target": 100,
    })

    # Prolific Builder — 30+ repos
    achievements.append({
        "id": "prolific_builder",
        "name": "Prolific Builder",
        "emoji": "📦",
        "description": "Created 30+ repositories",
        "unlocked": len(original_repos) >= 30,
        "value": len(original_repos),
        "target": 30,
    })

    # Fresh Sprout — Account less than 1 year
    achievements.append({
        "id": "fresh_sprout",
        "name": "Fresh Sprout",
        "emoji": "🌱",
        "description": "New to GitHub (< 1 year)",
        "unlocked": account_age_years < 1,
        "value": account_age_years,
        "target": 1,
    })

    # Popular Repo — Any repo with 10+ stars
    has_popular = any(r["stars"] >= 10 for r in repos)
    max_stars = max((r["stars"] for r in repos), default=0)
    achievements.append({
        "id": "popular_repo",
        "name": "Popular Repo",
        "emoji": "⭐",
        "description": "Has a repo with 10+ stars",
        "unlocked": has_popular,
        "value": max_stars,
        "target": 10,
    })

    # Open Source Fan — 5+ forked repos
    forked_count = len(repos) - len(original_repos)
    achievements.append({
        "id": "open_source_fan",
        "name": "Open Source Fan",
        "emoji": "🤝",
        "description": "Forked 5+ open source projects",
        "unlocked": forked_count >= 5,
        "value": forked_count,
        "target": 5,
    })

    return achievements
