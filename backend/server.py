from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Recipe(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    dish_type: str  # hot, cold, smoothie, juicing
    diet_type: Optional[str] = None  # keto, paleo, vegan, etc.
    ingredients: List[str]
    instructions: List[str]
    prep_time: Optional[str] = None
    cook_time: Optional[str] = None
    servings: Optional[int] = None
    nutritional_info: Optional[dict] = None
    health_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    image_url: Optional[str] = None

class RecipeGenerateRequest(BaseModel):
    dish_type: str  # hot, cold, smoothie, juicing
    diet_type: Optional[str] = None
    health_conditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    preferences: Optional[str] = None

class Medication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # diabetes, hypertension, heart_disease, etc.
    avoid_foods: List[str] = []
    recommended_foods: List[str] = []
    vitamin_interactions: Optional[dict] = None
    is_custom: bool = False

class MedicationCreate(BaseModel):
    name: str
    category: Optional[str] = "other"

class UserMedication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    medication_id: str
    medication_name: str
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FoodRecommendation(BaseModel):
    recommended_foods: List[str]
    foods_to_avoid: List[str]
    vitamin_recommendations: List[str]
    general_advice: str

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ PREDEFINED MEDICATIONS ============

PREDEFINED_MEDICATIONS = [
    {
        "id": "med-1",
        "name": "Metformin",
        "category": "diabetes",
        "avoid_foods": ["Excessive alcohol", "High-sugar foods"],
        "recommended_foods": ["Whole grains", "Leafy greens", "Lean proteins", "Berries"],
        "vitamin_interactions": {"B12": "May reduce absorption - consider supplement"},
        "is_custom": False
    },
    {
        "id": "med-2",
        "name": "Lisinopril",
        "category": "hypertension",
        "avoid_foods": ["High-sodium foods", "Potassium-rich foods (excessive)", "Alcohol"],
        "recommended_foods": ["Low-sodium vegetables", "Lean proteins", "Whole grains"],
        "vitamin_interactions": {"Potassium": "Monitor levels - avoid excessive supplementation"},
        "is_custom": False
    },
    {
        "id": "med-3",
        "name": "Warfarin",
        "category": "blood_thinner",
        "avoid_foods": ["Vitamin K-rich foods (in large amounts)", "Alcohol", "Cranberry juice"],
        "recommended_foods": ["Consistent diet", "Moderate portions", "Low vitamin K options"],
        "vitamin_interactions": {"Vitamin K": "Avoid supplements - interferes with medication"},
        "is_custom": False
    },
    {
        "id": "med-4",
        "name": "Levothyroxine",
        "category": "thyroid",
        "avoid_foods": ["Soy products", "High-fiber foods (near medication time)", "Walnuts", "Grapefruit"],
        "recommended_foods": ["Lean proteins", "Vegetables", "Fruits", "Whole grains"],
        "vitamin_interactions": {"Calcium/Iron": "Take 4 hours apart from medication"},
        "is_custom": False
    },
    {
        "id": "med-5",
        "name": "Atorvastatin",
        "category": "cholesterol",
        "avoid_foods": ["Grapefruit and grapefruit juice", "High-fat foods", "Excessive alcohol"],
        "recommended_foods": ["Oats", "Nuts", "Fatty fish", "Olive oil", "Fruits and vegetables"],
        "vitamin_interactions": {"CoQ10": "May be beneficial as statin can reduce levels"},
        "is_custom": False
    },
    {
        "id": "med-6",
        "name": "Omeprazole",
        "category": "acid_reflux",
        "avoid_foods": ["Spicy foods", "Citrus", "Tomatoes", "Caffeine", "Chocolate"],
        "recommended_foods": ["Bananas", "Oatmeal", "Green vegetables", "Lean meats"],
        "vitamin_interactions": {"Magnesium/B12": "Long-term use may reduce absorption"},
        "is_custom": False
    }
]

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    password_hash = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=password_hash,
        name=user_data.name
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token(user.id, user.email)
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user['id'], user['email'])
    
    user_response = UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        created_at=datetime.fromisoformat(user['created_at']) if isinstance(user['created_at'], str) else user['created_at']
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user['id'],
        email=current_user['email'],
        name=current_user['name'],
        created_at=datetime.fromisoformat(current_user['created_at']) if isinstance(current_user['created_at'], str) else current_user['created_at']
    )

# ============ RECIPE ENDPOINTS ============

@api_router.post("/recipes/generate", response_model=Recipe)
async def generate_recipe(request: RecipeGenerateRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Build prompt for AI
        prompt = f"""Generate a detailed {request.dish_type} dish recipe"""
        
        if request.diet_type:
            prompt += f" following a {request.diet_type} diet"
        
        if request.health_conditions:
            prompt += f" suitable for someone with: {', '.join(request.health_conditions)}"
        
        if request.medications:
            prompt += f" that is safe with these medications: {', '.join(request.medications)}"
        
        if request.preferences:
            prompt += f". Additional preferences: {request.preferences}"
        
        prompt += """

Please provide the recipe in this exact format:

Recipe Name: [Name]
Dish Type: [hot/cold/smoothie/juicing]
Prep Time: [X minutes]
Cook Time: [X minutes]
Servings: [X]

Ingredients:
- [ingredient 1]
- [ingredient 2]
...

Instructions:
1. [step 1]
2. [step 2]
...

Nutritional Info (per serving):
Calories: [X]
Protein: [X]g
Carbs: [X]g
Fat: [X]g
Fiber: [X]g

Health Notes: [Any important health considerations or benefits]
"""

        # Call AI with Emergent LLM Key
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"recipe-gen-{current_user['id']}-{uuid.uuid4()}",
            system_message="You are a professional nutritionist and chef specializing in healthy, clinical-grade recipes."
        )
        chat.with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse AI response
        recipe_text = response
        lines = recipe_text.split('\n')
        
        recipe_name = "Generated Recipe"
        ingredients = []
        instructions = []
        prep_time = None
        cook_time = None
        servings = None
        nutritional_info = {}
        health_notes = None
        
        current_section = None
        instruction_counter = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if line.startswith("Recipe Name:"):
                recipe_name = line.replace("Recipe Name:", "").strip()
            elif line.startswith("Prep Time:"):
                prep_time = line.replace("Prep Time:", "").strip()
            elif line.startswith("Cook Time:"):
                cook_time = line.replace("Cook Time:", "").strip()
            elif line.startswith("Servings:"):
                try:
                    servings = int(line.replace("Servings:", "").strip().split()[0])
                except:
                    servings = 4
            elif line.startswith("Ingredients:"):
                current_section = "ingredients"
            elif line.startswith("Instructions:"):
                current_section = "instructions"
            elif line.startswith("Nutritional Info"):
                current_section = "nutrition"
            elif line.startswith("Health Notes:"):
                health_notes = line.replace("Health Notes:", "").strip()
                current_section = None
            elif current_section == "ingredients" and (line.startswith("-") or line.startswith("•")):
                ingredients.append(line[1:].strip())
            elif current_section == "instructions" and (line[0].isdigit() or line.startswith("-")):
                # Remove numbering
                if line[0].isdigit():
                    line = line.split(".", 1)[-1].strip() if "." in line else line
                instructions.append(line.strip())
            elif current_section == "nutrition":
                if ":" in line:
                    key, value = line.split(":", 1)
                    nutritional_info[key.strip()] = value.strip()
        
        # Placeholder image based on dish type
        image_urls = {
            "hot": "https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg",
            "cold": "https://images.unsplash.com/photo-1719196339826-c66c13ad5b86",
            "smoothie": "https://images.unsplash.com/photo-1557568951-a691f75c810f",
            "juicing": "https://images.unsplash.com/photo-1497534446932-c925b458314e"
        }
        
        recipe = Recipe(
            user_id=current_user['id'],
            name=recipe_name,
            dish_type=request.dish_type,
            diet_type=request.diet_type,
            ingredients=ingredients if ingredients else ["Ingredient parsing failed - see instructions"],
            instructions=instructions if instructions else [recipe_text],
            prep_time=prep_time,
            cook_time=cook_time,
            servings=servings or 4,
            nutritional_info=nutritional_info if nutritional_info else None,
            health_notes=health_notes,
            image_url=image_urls.get(request.dish_type.lower(), image_urls["hot"])
        )
        
        recipe_dict = recipe.model_dump()
        recipe_dict['created_at'] = recipe_dict['created_at'].isoformat()
        await db.recipes.insert_one(recipe_dict)
        
        return recipe
        
    except Exception as e:
        logger.error(f"Recipe generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recipe: {str(e)}")

@api_router.get("/recipes/list", response_model=List[Recipe])
async def list_recipes(current_user: dict = Depends(get_current_user)):
    recipes = await db.recipes.find({"user_id": current_user['id']}, {"_id": 0}).to_list(100)
    
    for recipe in recipes:
        if isinstance(recipe.get('created_at'), str):
            recipe['created_at'] = datetime.fromisoformat(recipe['created_at'])
    
    return recipes

@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.recipes.delete_one({"id": recipe_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Recipe deleted successfully"}

# ============ MEDICATION ENDPOINTS ============

@api_router.get("/medications/list")
async def list_medications():
    # Return predefined medications
    custom_meds = await db.medications.find({"is_custom": True}, {"_id": 0}).to_list(100)
    return PREDEFINED_MEDICATIONS + custom_meds

@api_router.post("/medications/add-custom", response_model=Medication)
async def add_custom_medication(med_data: MedicationCreate, current_user: dict = Depends(get_current_user)):
    medication = Medication(
        name=med_data.name,
        category=med_data.category or "other",
        avoid_foods=[],
        recommended_foods=[],
        is_custom=True
    )
    
    med_dict = medication.model_dump()
    await db.medications.insert_one(med_dict)
    
    return medication

# ============ USER MEDICATION ENDPOINTS ============

@api_router.post("/user-medications/add")
async def add_user_medication(medication_id: str, current_user: dict = Depends(get_current_user)):
    # Check if medication exists
    medication = None
    for med in PREDEFINED_MEDICATIONS:
        if med['id'] == medication_id:
            medication = med
            break
    
    if not medication:
        medication = await db.medications.find_one({"id": medication_id}, {"_id": 0})
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    # Check if already added
    existing = await db.user_medications.find_one({
        "user_id": current_user['id'],
        "medication_id": medication_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Medication already added")
    
    user_med = UserMedication(
        user_id=current_user['id'],
        medication_id=medication_id,
        medication_name=medication['name']
    )
    
    user_med_dict = user_med.model_dump()
    user_med_dict['added_at'] = user_med_dict['added_at'].isoformat()
    await db.user_medications.insert_one(user_med_dict)
    
    return {"message": "Medication added successfully", "medication": user_med}

@api_router.get("/user-medications/list")
async def list_user_medications(current_user: dict = Depends(get_current_user)):
    user_meds = await db.user_medications.find({"user_id": current_user['id']}, {"_id": 0}).to_list(100)
    return user_meds

@api_router.delete("/user-medications/{medication_id}")
async def remove_user_medication(medication_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.user_medications.delete_one({
        "user_id": current_user['id'],
        "medication_id": medication_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medication not found in your list")
    
    return {"message": "Medication removed successfully"}

# ============ RECOMMENDATION ENDPOINTS ============

@api_router.get("/recommendations/foods-for-meds", response_model=FoodRecommendation)
async def get_food_recommendations(current_user: dict = Depends(get_current_user)):
    # Get user's medications
    user_meds = await db.user_medications.find({"user_id": current_user['id']}, {"_id": 0}).to_list(100)
    
    if not user_meds:
        return FoodRecommendation(
            recommended_foods=[],
            foods_to_avoid=[],
            vitamin_recommendations=[],
            general_advice="No medications added yet. Add your medications to get personalized food recommendations."
        )
    
    # Aggregate recommendations
    recommended_foods_set = set()
    foods_to_avoid_set = set()
    vitamin_recommendations = []
    
    for user_med in user_meds:
        # Find medication details
        medication = None
        for med in PREDEFINED_MEDICATIONS:
            if med['id'] == user_med['medication_id']:
                medication = med
                break
        
        if not medication:
            medication = await db.medications.find_one({"id": user_med['medication_id']}, {"_id": 0})
        
        if medication:
            recommended_foods_set.update(medication.get('recommended_foods', []))
            foods_to_avoid_set.update(medication.get('avoid_foods', []))
            
            if medication.get('vitamin_interactions'):
                for vitamin, note in medication['vitamin_interactions'].items():
                    vitamin_recommendations.append(f"{vitamin}: {note} (for {medication['name']})")
    
    general_advice = f"You are currently taking {len(user_meds)} medication(s). " \
                    f"Focus on the recommended foods and avoid the listed items to optimize your health outcomes."
    
    return FoodRecommendation(
        recommended_foods=list(recommended_foods_set),
        foods_to_avoid=list(foods_to_avoid_set),
        vitamin_recommendations=vitamin_recommendations,
        general_advice=general_advice
    )

# ============ ROOT ENDPOINT ============

@api_router.get("/")
async def root():
    return {"message": "Clinical Recipe System API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
