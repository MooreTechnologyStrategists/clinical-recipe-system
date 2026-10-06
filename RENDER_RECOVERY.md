# Recipe service recovery

The Render service uses root directory `backend`, build `pip install -r requirements.txt`, and start `uvicorn main:app --host 0.0.0.0 --port $PORT`. The new main.py exports the actual server app.

Configure MONGO_URL and DB_NAME in Render Environment using your existing database details. Recipe generation also requires EMERGENT_LLM_KEY; the current code sends this value to the OpenAI API, so it must be an OpenAI-compatible credential. Do not paste credentials into chat or commit them. Configure the frontend REACT_APP_BACKEND_URL for the same deployed backend. No billing or paid plan changes are included.

All private endpoints now require a random per-browser session header. Profiles, pantry, recipes, and ratings are scoped to that session. This is anonymous browser isolation, not account authentication or medical-grade compliance. Clearing browser storage loses access to that anonymous space. Legacy unowned database records are preserved but never returned or adopted.

The website pantry matcher and weekly planner work independently at askdogood.com/whats-good-to-eat. They do not claim to scan food photographs. The older AI service remains unavailable until its environment is configured and a real deployment is verified. AI dietary suggestions and nutrition estimates require review; this repair does not establish clinical suitability.

Validation: python -m unittest test_private_records.py (fake records only; no real database/AI calls). The generator now parses the response text rather than trying to strip the HTTP response object and includes allergies even when no condition is selected.
