# Clinical Nutritional Recipe System - Integration Guide for AskDoGood.com

## Overview
This guide explains how to integrate the Clinical Nutritional Recipe System with AskDoGood.com to create a seamless health and wellness ecosystem.

## Integration Options

### Option 1: Embedded iFrame (Simplest)
Embed the recipe system directly into AskDoGood.com pages using an iframe.

```html
<iframe 
  src="https://veggie-remix.preview.emergentagent.com" 
  width="100%" 
  height="100%" 
  style="border: none; min-height: 800px;"
  title="Clinical Nutritional Recipe System"
></iframe>
```

**Pros:**
- Quick implementation (5 minutes)
- No backend changes needed
- Automatic updates when recipe system is updated

**Cons:**
- Limited customization
- Separate authentication context

### Option 2: Single Sign-On (SSO) Integration (Recommended)
Enable users to access the recipe system with their AskDoGood.com credentials.

#### Backend Implementation

**1. Add SSO Endpoint to Recipe System Backend**
```python
# Add to /app/backend/server.py

from fastapi import HTTPException, Header
import jwt

@api_router.post("/auth/sso")
async def sso_login(token: str = Header(None)):
    """Authenticate user via AskDoGood SSO token"""
    try:
        # Verify JWT token from AskDoGood.com
        payload = jwt.decode(token, "YOUR_SHARED_SECRET", algorithms=["HS256"])
        
        user_id = payload.get("user_id")
        email = payload.get("email")
        
        # Create or retrieve user session
        # Return session token for recipe system
        
        return {
            "session_token": "generated_token",
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**2. AskDoGood.com Backend Changes**
```python
# Generate SSO token when user clicks on recipe system link

import jwt
from datetime import datetime, timedelta

def generate_recipe_system_token(user):
    payload = {
        "user_id": user.id,
        "email": user.email,
        "health_conditions": user.health_conditions,  # Sync health data
        "allergies": user.allergies,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    
    token = jwt.encode(payload, "YOUR_SHARED_SECRET", algorithm="HS256")
    return token
```

#### Frontend Implementation

**1. Add Link/Button in AskDoGood.com**
```html
<a href="/health/recipes" class="btn-primary">
  Access Your Personalized Recipes
</a>
```

**2. Create Route Handler**
```javascript
// When user clicks "Access Recipes" button
async function accessRecipeSystem() {
  // Get SSO token from your backend
  const response = await fetch('/api/generate-recipe-token', {
    credentials: 'include'
  });
  
  const { token } = await response.json();
  
  // Redirect to recipe system with token
  window.location.href = `https://veggie-remix.preview.emergentagent.com?sso_token=${token}`;
}
```

### Option 3: Full Profile Synchronization (Most Integrated)
Sync user health profiles between AskDoGood.com and the Recipe System in real-time.

#### Architecture

```
AskDoGood.com User Profile
         ↓
    [Webhook/API]
         ↓
Clinical Recipe System
    Health Profile
```

#### Implementation Steps

**1. Create Webhook Endpoint in Recipe System**
```python
@api_router.post("/webhooks/profile-sync")
async def sync_health_profile(
    user_id: str,
    health_data: dict,
    api_key: str = Header(None)
):
    """Receive health profile updates from AskDoGood.com"""
    
    # Verify API key
    if api_key != os.environ.get('ASKDOGOOD_API_KEY'):
        raise HTTPException(status_code=401)
    
    # Update or create health profile
    profile = HealthProfile(
        id=user_id,
        conditions=health_data.get('conditions', []),
        allergies=health_data.get('allergies', []),
        age_range=health_data.get('age_range'),
        activity_level=health_data.get('activity_level'),
        health_goals=health_data.get('health_goals', [])
    )
    
    # Save to database
    await db.health_profiles.update_one(
        {"id": user_id},
        {"$set": profile.model_dump()},
        upsert=True
    )
    
    return {"status": "synced"}
```

**2. Add Webhook Trigger in AskDoGood.com**
```python
# In AskDoGood.com backend - trigger whenever health profile updates

async def sync_to_recipe_system(user):
    """Send health profile to recipe system"""
    
    payload = {
        "user_id": user.id,
        "health_data": {
            "conditions": user.health_conditions,
            "allergies": user.allergies,
            "age_range": user.age_range,
            "activity_level": user.activity_level,
            "health_goals": user.health_goals
        }
    }
    
    response = await httpx.post(
        "https://veggie-remix.preview.emergentagent.com/api/webhooks/profile-sync",
        json=payload,
        headers={
            "api-key": "YOUR_SHARED_API_KEY",
            "Content-Type": "application/json"
        }
    )
    
    return response.status_code == 200
```

## Data Mapping

### Health Conditions Mapping
Map AskDoGood.com health conditions to Recipe System format:

```python
CONDITION_MAPPING = {
    "high_blood_pressure": "hypertension",
    "type_2_diabetes": "diabetes",
    "ckd": "kidney_disease",
    "cvd": "heart_disease",
    # ... add more mappings
}
```

### User Profile Fields

| AskDoGood Field | Recipe System Field | Notes |
|----------------|---------------------|-------|
| user.health_conditions | profile.conditions | Array of condition codes |
| user.food_allergies | profile.allergies | Array of allergen names |
| user.age | profile.age_range | Convert to range (e.g., "51-60") |
| user.exercise_level | profile.activity_level | Map to 5-level scale |
| user.health_goals | profile.health_goals | Direct mapping |

## Authentication Flow

### Recommended Flow for AskDoGood Integration

1. User logs into AskDoGood.com
2. User clicks "Personalized Recipes" or "Meal Planning"
3. AskDoGood generates SSO token with user data
4. User redirected to Recipe System with token
5. Recipe System validates token and creates session
6. Health profile automatically populated from AskDoGood data
7. User can immediately start generating recipes

### Session Management

```javascript
// Store session in both systems for seamless experience
const sessionData = {
  askdogood_user_id: "user123",
  recipe_session_token: "token456",
  sync_timestamp: Date.now()
};

localStorage.setItem('unified_session', JSON.stringify(sessionData));
```

## Embedding Strategy

### Full Page Embed
```html
<!-- Dedicated /recipes page on AskDoGood.com -->
<div class="recipe-system-container">
  <iframe 
    src="https://veggie-remix.preview.emergentagent.com?embedded=true&user_id=${userId}"
    style="width: 100%; height: calc(100vh - 80px); border: none;"
  ></iframe>
</div>
```

### Sidebar Widget
```html
<!-- Quick recipe access in sidebar -->
<div class="recipe-widget">
  <h3>Today's Healthy Recipe</h3>
  <iframe 
    src="https://veggie-remix.preview.emergentagent.com/widget/daily-recipe?user_id=${userId}"
    style="width: 100%; height: 400px; border: 1px solid #e5e7eb; border-radius: 8px;"
  ></iframe>
</div>
```

## Pricing Integration

### Subscription Management

**Option A: Bundle with AskDoGood Subscription**
- Include recipe system access in AskDoGood premium tier
- Single billing through AskDoGood
- Revenue share agreement

**Option B: Separate Add-On**
- $0.99/month add-on to AskDoGood subscription
- Managed through AskDoGood billing system
- Automatic activation when subscribed

**Implementation Example:**
```python
# Check subscription status
@api_router.get("/auth/verify-subscription")
async def verify_subscription(user_id: str):
    # Check if user has active subscription via AskDoGood
    response = await httpx.get(
        f"https://askdogood.com/api/subscriptions/{user_id}",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    
    subscription_data = response.json()
    
    has_recipe_access = (
        subscription_data.get('tier') == 'premium' or
        'recipe_system' in subscription_data.get('addons', [])
    )
    
    return {
        "has_access": has_recipe_access,
        "subscription_tier": subscription_data.get('tier')
    }
```

## Security Considerations

### 1. Token Security
- Use HTTPS only
- Short-lived tokens (24 hours max)
- Secure token storage
- Token rotation on suspicious activity

### 2. API Key Management
```python
# Environment variables (never commit to code)
ASKDOGOOD_API_KEY=your_secure_api_key_here
RECIPE_SYSTEM_API_KEY=your_secure_api_key_here
JWT_SECRET=your_jwt_secret_here
```

### 3. Rate Limiting
```python
# Prevent abuse
from slowapi import Limiter

limiter = Limiter(key_func=lambda: request.headers.get("X-User-ID"))

@api_router.post("/recipes/generate")
@limiter.limit("10/minute")
async def generate_recipe():
    # ... implementation
```

## Testing Integration

### 1. Test SSO Flow
```bash
# Generate test token
curl -X POST https://askdogood.com/api/test/generate-token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_123"}'

# Verify token with recipe system
curl -X POST https://veggie-remix.preview.emergentagent.com/api/auth/sso \
  -H "token: YOUR_TEST_TOKEN"
```

### 2. Test Profile Sync
```bash
# Send test webhook
curl -X POST https://veggie-remix.preview.emergentagent.com/api/webhooks/profile-sync \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_123",
    "health_data": {
      "conditions": ["hypertension", "diabetes"],
      "allergies": ["Peanuts"]
    }
  }'
```

## Deployment Checklist

- [ ] Set up shared secrets (JWT, API keys)
- [ ] Configure CORS for AskDoGood.com domain
- [ ] Implement SSO endpoint
- [ ] Add webhook for profile sync
- [ ] Set up subscription verification
- [ ] Configure embedded iframe security
- [ ] Test authentication flow end-to-end
- [ ] Test profile synchronization
- [ ] Set up error monitoring
- [ ] Configure rate limiting
- [ ] Update privacy policy to reflect data sharing
- [ ] Add integration documentation for users

## Support & Troubleshooting

### Common Issues

**Issue: Authentication fails**
- Verify JWT secret matches on both systems
- Check token expiration
- Ensure HTTPS is used

**Issue: Profile doesn't sync**
- Verify webhook URL is correct
- Check API key is valid
- Ensure webhook payload matches expected format

**Issue: iframe doesn't load**
- Check CORS configuration
- Verify Content-Security-Policy headers
- Ensure X-Frame-Options allows embedding

## Contact & API Documentation

For technical support or API access:
- Email: support@askdogood.com
- API Docs: https://veggie-remix.preview.emergentagent.com/docs
- Integration Support: Schedule call with dev team

## Pricing for AskDoGood Partnership

**Proposed Revenue Share:**
- Free tier: Included in AskDoGood premium
- $0.99/month tier: 70% AskDoGood / 30% Recipe System
- Volume discounts available for 1000+ users

**Alternatively:**
- White-label licensing: $X/month flat fee
- Full system transfer to AskDoGood infrastructure
