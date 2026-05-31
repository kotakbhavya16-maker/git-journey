"""
app.py — Main Flask server for GitJourney API.
Handles all routes, rate limiting, CORS, and error handling.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import re
import os
import requests

from github_service import fetch_user_profile, fetch_user_repos, analyze_github_data, fetch_user_events, fetch_repo_details
from ai_analyzer import generate_ai_analysis, generate_battle_analysis, generate_profile_readme
import sqlite3
import time
import json

DATABASE = os.path.join(os.path.dirname(__file__), "cache.db")

def init_db():
    """Initialize SQLite database for caching."""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS profile_cache (
            username TEXT PRIMARY KEY,
            profile_data TEXT,
            cached_at REAL
        )
    """)
    conn.commit()
    conn.close()

# Initialize cache database on startup
init_db()

def get_cached_profile(username):
    """Retrieve cached profile data if fresh (less than 1 hour old)."""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("SELECT profile_data, cached_at FROM profile_cache WHERE LOWER(username) = ?", (username.lower(),))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            profile_data_json, cached_at = row
            # 1 hour = 3600 seconds
            if time.time() - cached_at < 3600:
                print(f"[Cache Hit] Returning cached profile for {username}")
                return json.loads(profile_data_json)
    except Exception as e:
        print(f"Error reading cache: {e}")
    return None

def cache_profile(username, data):
    """Cache profile data."""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO profile_cache (username, profile_data, cached_at) VALUES (?, ?, ?)",
            (username.lower(), json.dumps(data), time.time())
        )
        conn.commit()
        conn.close()
        print(f"[Cache Store] Cached profile for {username}")
    except Exception as e:
        print(f"Error writing to cache: {e}")

def handle_github_error(e):
    """Handle GitHub API errors and return a descriptive response."""
    status_code = e.response.status_code if e.response is not None else 500
    error_msg = "GitHub API error occurred."
    
    if status_code == 403:
        is_rate_limit = False
        if e.response is not None:
            body = {}
            try:
                body = e.response.json()
            except Exception:
                pass
            msg = body.get("message", "")
            if "rate limit" in msg.lower() or "api rate limit" in msg.lower():
                is_rate_limit = True
        
        if is_rate_limit:
            error_msg = "GitHub API rate limit exceeded. Please configure a GITHUB_TOKEN in backend/.env to increase the limit."
        else:
            error_msg = "GitHub API access forbidden. Please verify your GITHUB_TOKEN in backend/.env is correct."
    elif status_code == 401:
        error_msg = "GitHub API unauthorized. The GITHUB_TOKEN in backend/.env is invalid or expired."
    else:
        if e.response is not None:
            try:
                body = e.response.json()
                error_msg = body.get("message", error_msg)
            except Exception:
                pass
        else:
            error_msg = str(e)
            
    print(f"Error calling GitHub API: {error_msg}")
    return jsonify({
        "success": False,
        "error": error_msg
    }), status_code

# Load environment variables
load_dotenv()

app = Flask(__name__)

# CORS — allow frontend dev server and production
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
CORS(app, origins=FRONTEND_ORIGINS)

# Rate limiting — 30 requests per minute per IP
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["30 per minute"]
)

# GitHub username validation regex
USERNAME_REGEX = re.compile(r'^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$')


def validate_username(username):
    """Validate GitHub username format."""
    if not username or not isinstance(username, str):
        return False
    return bool(USERNAME_REGEX.match(username.strip()))


@app.route("/api/health", methods=["GET"])
@limiter.exempt
def health_check():
    """Health check endpoint."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    api_configured = bool(api_key and api_key != "your_gemini_api_key_here")
    frontend_origins = os.getenv("FRONTEND_ORIGINS", "not-set")
    return jsonify({
        "status": "ok",
        "api_configured": api_configured,
        "frontend_origins": frontend_origins,
        "message": "GitJourney API is running! 🐙"
    })


@app.route("/api/analyze", methods=["POST"])
def analyze_profile():
    """Analyze a single GitHub profile."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        username = data.get("username", "").strip()

        if not validate_username(username):
            return jsonify({
                "success": False,
                "error": "Invalid GitHub username. Use only letters, numbers, and hyphens."
            }), 400

        # Retrieve user token if provided
        user_token = request.headers.get("X-GitHub-Token", "").strip()
        
        # Check cache if NO custom user token is provided
        if not user_token:
            cached_data = get_cached_profile(username)
            if cached_data:
                return jsonify({
                    "success": True,
                    "data": cached_data
                })

        # Step 1: Fetch GitHub profile
        profile = fetch_user_profile(username, token=user_token)
        if not profile:
            return jsonify({
                "success": False,
                "error": f"GitHub user '{username}' not found. Check the spelling!"
            }), 404

        # Step 2: Fetch repos
        repos = fetch_user_repos(username, token=user_token)

        # Step 3: Analyze GitHub data
        github_data = analyze_github_data(profile, repos)

        # Step 4: Fetch contribution heatmap
        events_data = fetch_user_events(username, token=user_token)

        # Step 5: AI Analysis (personality, roast, journey)
        ai_analysis = generate_ai_analysis(github_data)

        response_data = {
            **github_data,
            "contributions": events_data,
            "ai": ai_analysis
        }

        # Cache results only if NO custom token is used
        if not user_token:
            cache_profile(username, response_data)

        # Step 6: Combine and return
        return jsonify({
            "success": True,
            "data": response_data
        })

    except requests.exceptions.HTTPError as e:
        return handle_github_error(e)
    except Exception as e:
        print(f"Error analyzing profile: {e}")
        return jsonify({
            "success": False,
            "error": "Something went wrong while analyzing. Please try again."
        }), 500


@app.route("/api/battle", methods=["POST"])
def battle_profiles():
    """Compare two GitHub profiles."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        username1 = data.get("username1", "").strip()
        username2 = data.get("username2", "").strip()

        if not validate_username(username1) or not validate_username(username2):
            return jsonify({
                "success": False,
                "error": "One or both usernames are invalid."
            }), 400

        if username1.lower() == username2.lower():
            return jsonify({
                "success": False,
                "error": "You can't battle yourself! Enter two different usernames."
            }), 400

        # Retrieve user token if provided
        user_token = request.headers.get("X-GitHub-Token", "").strip()

        # Fetch and analyze both profiles
        profile1 = fetch_user_profile(username1, token=user_token)
        profile2 = fetch_user_profile(username2, token=user_token)

        if not profile1:
            return jsonify({"success": False, "error": f"User '{username1}' not found."}), 404
        if not profile2:
            return jsonify({"success": False, "error": f"User '{username2}' not found."}), 404

        repos1 = fetch_user_repos(username1, token=user_token)
        repos2 = fetch_user_repos(username2, token=user_token)

        data1 = analyze_github_data(profile1, repos1)
        data2 = analyze_github_data(profile2, repos2)

        # AI battle analysis
        battle_result = generate_battle_analysis(data1, data2)

        return jsonify({
            "success": True,
            "data": {
                "player1": data1,
                "player2": data2,
                "battle": battle_result
            }
        })

    except requests.exceptions.HTTPError as e:
        return handle_github_error(e)
    except Exception as e:
        print(f"Error in battle: {e}")
        return jsonify({
            "success": False,
            "error": "Something went wrong during the battle. Please try again."
        }), 500


@app.route("/api/repo", methods=["POST"])
def get_repo_details():
    """Get detailed info about a specific repository."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        username = data.get("username", "").strip()
        repo_name = data.get("repo", "").strip()

        if not validate_username(username) or not repo_name:
            return jsonify({"success": False, "error": "Invalid username or repo name."}), 400

        # Retrieve user token if provided
        user_token = request.headers.get("X-GitHub-Token", "").strip()
        details = fetch_repo_details(username, repo_name, token=user_token)
        if not details:
            return jsonify({"success": False, "error": f"Repository '{repo_name}' not found."}), 404

        return jsonify({"success": True, "data": details})

    except requests.exceptions.HTTPError as e:
        return handle_github_error(e)
    except Exception as e:
        print(f"Error fetching repo details: {e}")
        return jsonify({"success": False, "error": "Could not fetch repo details."}), 500


@app.route("/api/generate_readme", methods=["POST"])
def get_readme():
    """Generate profile README markdown."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        github_data = data.get("github_data")
        if not github_data:
            return jsonify({"success": False, "error": "No profile stats provided"}), 400

        readme = generate_profile_readme(github_data)
        return jsonify({"success": True, "data": readme})

    except Exception as e:
        print(f"Error generating readme: {e}")
        return jsonify({"success": False, "error": "Could not generate README."}), 500


@app.errorhandler(429)
def rate_limit_exceeded(e):
    """Handle rate limit errors."""
    return jsonify({
        "success": False,
        "error": "Too many requests! Please wait a moment and try again. ⏳"
    }), 429


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({
        "success": False,
        "error": "Endpoint not found."
    }), 404


if __name__ == "__main__":
    print("\n[GitJourney] API Server Starting...")
    print("[GitJourney] Running on http://127.0.0.1:5000")
    print("[GitJourney] Don't forget to set GEMINI_API_KEY in .env!\n")
    app.run(debug=True, port=5000)
