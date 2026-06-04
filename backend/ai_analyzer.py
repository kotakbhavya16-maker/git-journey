"""
ai_analyzer.py — Uses Google Gemini AI to generate developer personality,
fun roasts, and coding journey summaries from GitHub analytics data.
"""

import google.generativeai as genai
import json
import os


def configure_gemini():
    """Configure the Gemini API with the key from environment."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        return False
    genai.configure(api_key=api_key)
    return True


def generate_ai_analysis(github_data):
    """
    Generate complete AI analysis: personality, roast, and journey summary.
    Returns a dict with all AI-generated content.
    """
    if not configure_gemini():
        return get_fallback_analysis(github_data)

    model = genai.GenerativeModel("gemini-2.0-flash")

    # Build context string from GitHub data
    profile = github_data["profile"]
    stats = github_data["stats"]
    languages = github_data["languages"]
    timeline = github_data["timeline"]
    top_repo = github_data.get("top_repo")
    achievements = github_data["achievements"]

    unlocked = [a["name"] for a in achievements if a["unlocked"]]
    top_langs = ", ".join([f'{l["name"]} ({l["percentage"]}%)' for l in languages[:5]])
    timeline_str = ", ".join([f'{t["year"]}: {t["repos"]} repos' for t in timeline])

    context = f"""
GitHub Profile Analysis:
- Username: {profile['username']}
- Name: {profile['name']}
- Bio: {profile['bio']}
- Location: {profile['location']}
- Total Repos: {stats['total_repos']} ({stats['original_repos']} original, {stats['forked_repos']} forked)
- Total Stars: {stats['total_stars']}
- Total Forks: {stats['total_forks']}
- Followers: {profile['followers']}
- Following: {profile['following']}
- Account Age: {stats['account_age_years']} years
- Top Languages: {top_langs}
- Yearly Activity: {timeline_str}
- Top Repo: {top_repo['name'] if top_repo else 'N/A'} ({top_repo['stars'] if top_repo else 0} stars)
- Achievements Unlocked: {', '.join(unlocked) if unlocked else 'None yet'}
"""

    prompt = f"""You are a fun, witty developer personality analyzer. Based on this GitHub profile data, generate a JSON response with EXACTLY this structure (no markdown, no code blocks, just raw JSON):

{context}

Respond with this exact JSON format:
{{
    "personality": {{
        "type_name": "A creative 3-4 word personality title (e.g., 'Night-Owl Full-Stack Hustler', 'The Silent Architect', 'Weekend Code Warrior')",
        "emoji": "One relevant emoji for the personality",
        "description": "A 2-3 sentence personality description that's fun and encouraging",
        "traits": [
            {{"name": "Consistency", "score": 75, "label": "A short label like 'Steady Builder'"}},
            {{"name": "Diversity", "score": 60, "label": "A short label like 'Explorer'"}},
            {{"name": "Impact", "score": 40, "label": "A short label like 'Rising Star'"}},
            {{"name": "Community", "score": 55, "label": "A short label like 'Team Player'"}}
        ]
    }},
    "roast": {{
        "lines": [
            "A funny but KIND observation about their coding habits (max 4 lines)",
            "Another witty observation",
            "A third humorous line",
            "A final encouraging roast line"
        ],
        "overall_vibe": "A one-line summary of their GitHub vibe"
    }},
    "journey_summary": "A 3-4 sentence professional narrative of their coding journey evolution. Make it sound like a story. Mention specific languages and patterns you notice.",
    "tips": [
        "One specific actionable improvement tip",
        "Another helpful suggestion",
        "A third tip for growth"
    ]
}}

IMPORTANT RULES:
- Be FUNNY but NEVER mean or hurtful
- Be encouraging and positive overall
- Make observations specific to their actual data (languages, stars, repos)
- Trait scores should be 0-100 and realistic based on their data
- Keep roast lines short and punchy (under 15 words each)
- Return ONLY the JSON, no other text
"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Clean up response — remove markdown code blocks if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]  # Remove first line
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]  # Remove last ```
        text = text.replace("```json", "").replace("```", "").strip()

        result = json.loads(text)
        return result
    except (json.JSONDecodeError, Exception) as e:
        print(f"AI Analysis Error: {e}")
        return get_fallback_analysis(github_data)


def generate_battle_analysis(data1, data2):
    """Generate AI comparison and collaboration analysis between two GitHub profiles."""
    if not configure_gemini():
        return get_fallback_battle(data1, data2)

    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""Compare these two GitHub developers, evaluate their coding compatibility as team members, and assign custom project roles based on their strengths.

Developer 1: {data1['profile']['username']}
- Repos: {data1['stats']['total_repos']}, Stars: {data1['stats']['total_stars']}
- Top languages: {', '.join([l['name'] for l in data1['languages'][:3]])}
- Followers: {data1['profile']['followers']}
- Account age: {data1['stats']['account_age_years']} years

Developer 2: {data2['profile']['username']}
- Repos: {data2['stats']['total_repos']}, Stars: {data2['stats']['total_stars']}
- Top languages: {', '.join([l['name'] for l in data2['languages'][:3]])}
- Followers: {data2['profile']['followers']}
- Account age: {data2['stats']['account_age_years']} years

Respond with ONLY this JSON schema (no markdown, no code blocks):
{{
    "winner": "username of overall winner",
    "verdict": "A fun 2-sentence comparison verdict",
    "categories": [
        {{"name": "Popularity", "winner": "username", "comment": "short fun comment"}},
        {{"name": "Productivity", "winner": "username", "comment": "short fun comment"}},
        {{"name": "Diversity", "winner": "username", "comment": "short fun comment"}}
    ],
    "compatibility_score": 0-100,
    "synergy_verdict": "A 2-sentence description of their team chemistry, highlighting how their languages and repositories complement or match each other",
    "roles": {{
        "developer1_role": "custom project role for Developer 1 (e.g. Frontend Architect, Systems Engineer)",
        "developer2_role": "custom project role for Developer 2 (must be complementary to Developer 1's role)"
    }}
}}
"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Battle Analysis Error: {e}")
        return get_fallback_battle(data1, data2)


def get_fallback_analysis(github_data):
    """Fallback analysis when Gemini API is not available."""
    stats = github_data["stats"]
    languages = github_data["languages"]
    top_lang = languages[0]["name"] if languages else "Code"

    return {
        "personality": {
            "type_name": f"The {top_lang} Explorer",
            "emoji": "🚀",
            "description": f"A developer with {stats['total_repos']} repos and a passion for {top_lang}. "
                          f"With {stats['account_age_years']} years on GitHub, they're building their legacy one commit at a time.",
            "traits": [
                {"name": "Consistency", "score": min(stats['total_repos'] * 3, 90), "label": "Builder"},
                {"name": "Diversity", "score": min(stats['total_languages'] * 15, 90), "label": "Explorer"},
                {"name": "Impact", "score": min(stats['total_stars'] * 5, 90), "label": "Influencer"},
                {"name": "Community", "score": min(github_data['profile']['followers'] * 2, 90), "label": "Networker"},
            ]
        },
        "roast": {
            "lines": [
                f"{stats['total_repos']} repos? Someone's been busy! 💪",
                f"Top language is {top_lang}. A person of culture! 🎯",
                f"{stats['total_stars']} stars — every star tells a story ⭐",
                "Keep pushing code, greatness is loading... ⏳"
            ],
            "overall_vibe": f"A {top_lang} enthusiast on a coding adventure!"
        },
        "journey_summary": f"Starting their GitHub journey {stats['account_age_years']} years ago, this developer has built {stats['total_repos']} repositories. "
                          f"Their primary weapon of choice is {top_lang}, with {stats['total_stars']} stars earned along the way. "
                          f"The journey continues with new commits and new possibilities!",
        "tips": [
            "Add detailed READMEs to all your projects — it's the first thing recruiters see!",
            "Try contributing to open source projects to boost visibility",
            "Pin your best 6 repositories on your GitHub profile"
        ]
    }


def get_fallback_battle(data1, data2):
    """Fallback battle analysis."""
    u1 = data1['profile']['username']
    u2 = data2['profile']['username']
    s1 = data1['stats']['total_stars']
    s2 = data2['stats']['total_stars']
    winner = u1 if s1 >= s2 else u2

    # Logical compatibility score calculation
    langs1 = set([l['name'].lower() for l in data1.get('languages', [])])
    langs2 = set([l['name'].lower() for l in data2.get('languages', [])])
    overlap = len(langs1.intersection(langs2))
    
    score = 75
    if overlap > 0:
        score += overlap * 4
    else:
        # Complementary skills (different stacks) is good too!
        score += 10
    
    score = min(max(score, 60), 98)

    # Determine roles
    def get_role(languages, alt_role):
        if not languages:
            return alt_role
        top_lang = languages[0]['name'].lower()
        if top_lang in ['javascript', 'typescript', 'html', 'css']:
            return "Frontend Specialist"
        elif top_lang in ['python', 'go', 'java', 'c++', 'c#', 'php', 'ruby', 'rust']:
            return "Backend Systems Developer"
        else:
            return "Software Generalist"

    r1 = get_role(data1.get('languages', []), "Full-Stack Engineer")
    r2 = get_role(data2.get('languages', []), "Systems Engineer")
    
    # Diversify if identical
    if r1 == r2:
        if r1 == "Backend Systems Developer":
            r2 = "Cloud & DevOps Specialist"
        elif r1 == "Frontend Specialist":
            r2 = "UI/UX & Interaction Designer"
        else:
            r2 = "Technical Project Manager"

    return {
        "winner": winner,
        "verdict": f"{winner} takes the crown in this coding showdown! Both developers bring unique strengths to the table.",
        "categories": [
            {"name": "Popularity", "winner": u1 if data1['profile']['followers'] >= data2['profile']['followers'] else u2, "comment": "The people have spoken!"},
            {"name": "Productivity", "winner": u1 if data1['stats']['total_repos'] >= data2['stats']['total_repos'] else u2, "comment": "Shipping code like a machine!"},
            {"name": "Diversity", "winner": u1 if data1['stats']['total_languages'] >= data2['stats']['total_languages'] else u2, "comment": "The polyglot wins!"},
        ],
        "compatibility_score": score,
        "synergy_verdict": f"{u1} and {u2} show strong alignment. With a compatibility index of {score}%, they possess the balanced technical capabilities needed to ship features rapidly together.",
        "roles": {
            "developer1_role": r1,
            "developer2_role": r2
        }
    }


def generate_profile_readme(github_data):
    """Generate an awesome GitHub profile README using Gemini AI."""
    if not configure_gemini():
        return get_fallback_readme(github_data)

    model = genai.GenerativeModel("gemini-2.0-flash")

    profile = github_data["profile"]
    stats = github_data["stats"]
    languages = github_data["languages"]
    achievements = github_data["achievements"]

    unlocked = [a["name"] for a in achievements if a["unlocked"]]
    top_langs = ", ".join([f'{l["name"]} ({l["percentage"]}%)' for l in languages[:5]])

    prompt = f"""You are a senior technical writer. Create a beautiful, modern, and highly professional GitHub Profile README in Markdown (.md format) for the following developer based on their statistics:

Developer Context:
- Name: {profile['name']} (@{profile['username']})
- Bio: {profile['bio']}
- Location: {profile['location']}
- Total Repos: {stats['total_repos']}
- Stars Earned: {stats['total_stars']}
- Top Programming Languages: {top_langs}
- Key Achievements: {', '.join(unlocked) if unlocked else 'None yet'}

Your markdown should look extremely clean, premium, and be ready to copy and paste. Use standard markdown formatting.
Include:
1. An eye-catching welcome header (e.g. "👋 Hi, I'm {profile['name']}")
2. A short, professional, and engaging "About Me" summary tailored to their profile (approx 3 sentences).
3. A visual "Tech Stack" section categorizing their languages (use simple markdown or formatting).
4. A "Stats & Highlights" section listing achievements (use emojis and clean lists).
5. A footer inviting collaboration.

Do NOT include any surrounding explanation or markdown code block wrapper (like ```markdown). Respond with ONLY the raw README markdown text.
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip any accidental code block wraps
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.replace("```markdown", "").replace("```", "").strip()
        return {"markdown": text}
    except Exception as e:
        print(f"Readme Generation Error: {e}")
        return get_fallback_readme(github_data)


def get_fallback_readme(github_data):
    """Fallback profile README when Gemini is unavailable."""
    profile = github_data["profile"]
    stats = github_data["stats"]
    languages = github_data["languages"]

    langs_str = "\n".join([f"- **{l['name']}** - {l['percentage']}%" for l in languages[:5]])

    markdown = f"""# 👋 Hi, I'm {profile['name']} (@{profile['username']})

{profile['bio'] or 'A developer building awesome things on GitHub.'}

## 💻 Tech Stack
Here are my primary tools and programming languages:
{langs_str}

## 📊 GitHub Stats
- 📦 **{stats['total_repos']}** Repositories
- 🌟 **{stats['total_stars']}** Stars earned
- 👥 **{profile['followers']}** Followers

## 🤝 Let's Connect
Feel free to explore my repositories or get in touch for collaboration!
"""
    return {"markdown": markdown.strip()}


def generate_repo_scan(repo_data):
    """Generate AI-powered repository quality analysis using Gemini."""
    if not configure_gemini():
        return get_fallback_repo_scan(repo_data)

    model = genai.GenerativeModel("gemini-2.0-flash")

    langs_str = ", ".join([f"{l['name']} ({l['percentage']}%)" for l in (repo_data.get('languages') or [])[:5]])
    contributors_count = len(repo_data.get('contributors') or [])
    recent_commits = repo_data.get('recent_commits') or []
    commits_str = "; ".join([f"{c['message'][:60]}" for c in recent_commits[:3]])

    prompt = f"""You are a senior code reviewer analyzing a GitHub repository. Based on the following repository metadata, generate a quality assessment.

Repository: {repo_data.get('name', 'Unknown')}
Description: {repo_data.get('description', 'No description')}
Primary Language: {repo_data.get('language', 'Unknown')}
All Languages: {langs_str or 'N/A'}
Stars: {repo_data.get('stars', 0)}
Forks: {repo_data.get('forks', 0)}
Watchers: {repo_data.get('watchers', 0)}
Open Issues: {repo_data.get('open_issues', 0)}
Size: {repo_data.get('size', 0)} KB
Is Fork: {repo_data.get('is_fork', False)}
License: {repo_data.get('license', 'None')}
Has Wiki: {repo_data.get('has_wiki', False)}
Topics: {', '.join(repo_data.get('topics') or []) or 'None'}
Created: {repo_data.get('created_at', 'Unknown')}
Last Push: {repo_data.get('pushed_at', 'Unknown')}
Contributors: {contributors_count}
Recent Commits: {commits_str or 'None available'}

Respond with ONLY this JSON (no markdown, no code blocks):
{{
    "quality_score": 0-100,
    "grade": "S/A/B/C/D",
    "maturity": "Prototype|Early Stage|Growing|Stable|Production-Ready",
    "summary": "A 2-sentence assessment of the repository's quality and purpose",
    "health": {{
        "has_description": true/false,
        "has_license": true/false,
        "has_topics": true/false,
        "active_development": true/false,
        "has_contributors": true/false,
        "good_documentation": true/false
    }},
    "strengths": ["strength 1", "strength 2"],
    "suggestions": ["improvement tip 1", "improvement tip 2", "improvement tip 3"]
}}

Be realistic and specific. Base scores on actual metrics provided.
"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Repo Scan Error: {e}")
        return get_fallback_repo_scan(repo_data)


def get_fallback_repo_scan(repo_data):
    """Fallback repository quality analysis using heuristics."""
    score = 40  # base score

    has_description = bool(repo_data.get('description'))
    has_license = bool(repo_data.get('license'))
    has_topics = bool(repo_data.get('topics') and len(repo_data['topics']) > 0)
    has_contributors = bool(repo_data.get('contributors') and len(repo_data['contributors']) > 1)
    langs = repo_data.get('languages') or []
    has_multi_lang = len(langs) > 1

    # Score calculation
    if has_description:
        score += 8
    if has_license:
        score += 10
    if has_topics:
        score += 5
    if has_contributors:
        score += 10
    if has_multi_lang:
        score += 5
    if repo_data.get('stars', 0) >= 1:
        score += min(repo_data['stars'] * 2, 10)
    if repo_data.get('forks', 0) >= 1:
        score += min(repo_data['forks'] * 3, 8)
    if repo_data.get('size', 0) > 100:
        score += 4

    # Active development check
    active = False
    pushed = repo_data.get('pushed_at', '')
    if pushed:
        try:
            from datetime import datetime
            push_date = datetime.strptime(pushed, "%Y-%m-%dT%H:%M:%SZ")
            days_since = (datetime.utcnow() - push_date).days
            active = days_since < 90
            if active:
                score += 8
        except Exception:
            pass

    score = min(max(score, 20), 98)

    # Grade
    if score >= 90:
        grade = "S"
    elif score >= 75:
        grade = "A"
    elif score >= 60:
        grade = "B"
    elif score >= 45:
        grade = "C"
    else:
        grade = "D"

    # Maturity
    if score >= 85:
        maturity = "Production-Ready"
    elif score >= 70:
        maturity = "Stable"
    elif score >= 55:
        maturity = "Growing"
    elif score >= 40:
        maturity = "Early Stage"
    else:
        maturity = "Prototype"

    name = repo_data.get('name', 'This repository')
    lang = repo_data.get('language', 'code')

    # Build suggestions
    suggestions = []
    if not has_description:
        suggestions.append("Add a clear, descriptive README explaining what the project does and how to use it.")
    if not has_license:
        suggestions.append("Add an open-source license (MIT, Apache 2.0) to clarify usage rights.")
    if not has_topics:
        suggestions.append("Add GitHub topics/tags to improve discoverability in search.")
    if not active:
        suggestions.append("Push recent updates to show the project is actively maintained.")
    if not has_contributors:
        suggestions.append("Invite collaborators or accept contributions to grow the project.")
    if len(suggestions) < 3:
        suggestions.append("Add unit tests and CI/CD pipeline to ensure code quality.")

    strengths = []
    if has_description:
        strengths.append("Clear project description")
    if has_license:
        strengths.append("Proper open-source licensing")
    if repo_data.get('stars', 0) > 0:
        strengths.append(f"Community recognition ({repo_data['stars']} stars)")
    if active:
        strengths.append("Actively maintained")
    if not strengths:
        strengths.append(f"Built with {lang}")

    return {
        "quality_score": score,
        "grade": grade,
        "maturity": maturity,
        "summary": f"{name} is a {maturity.lower()} {lang} project with a quality score of {score}/100. "
                   f"It has {repo_data.get('stars', 0)} stars and {len(langs)} technologies in its stack.",
        "health": {
            "has_description": has_description,
            "has_license": has_license,
            "has_topics": has_topics,
            "active_development": active,
            "has_contributors": has_contributors,
            "good_documentation": has_description and has_license
        },
        "strengths": strengths[:3],
        "suggestions": suggestions[:3]
    }



