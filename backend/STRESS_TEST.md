# Basic Stress Test Scenario

This document describes a simple manual stress-test plan to validate the finalize attempt logic and leaderboard under concurrent responses.

Goal
- Simulate N players (e.g., 50-500) joining a live session, answering questions rapidly, and ending the session to ensure Attempts are recorded atomically and the leaderboard is correct.

Tools
- Locust (recommended) or a simple Node/Python script using WebSocket clients.

Scenario
1. Create a quiz with 5-10 questions and a running game session.
2. Start a Locust test where each simulated user does:
   - Open WS connection to `/ws/game/<code>/`
   - Send `{"action":"join","name":"userX"}`
   - For each question: send `{"action":"answer","player_id":<id>,"choice_id":<choice>,"ts":<timestamp>}`
   - After answering all, one client sends `{"action":"end"}` (or send concurrently)

Checks
- Confirm: number of `Attempt` rows equals number of players (no duplicates).
- Confirm: `AttemptAnswer` count matches total responses.
- Confirm: leaderboard returned by consumer and the API endpoint match and are sorted by score.

Notes
- Start with small scale (10-50) and increase gradually.
- Monitor database connections and Redis (if used) to avoid running out of resources.
