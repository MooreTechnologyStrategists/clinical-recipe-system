from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============= Models =============

class Ingredient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # vegetables, fruits, grains, proteins, dairy, spices, condiments, etc.
    image_url: Optional[str] = None  # URL to ingredient image
    
class PantryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ingredient_name: str
    quantity: Optional[str] = None
    notes: Optional[str] = None
    added_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HealthProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conditions: List[str] = []  # hypertension, diabetes, kidney_disease, heart_disease, cancer, etc.
    allergies: List[str] = []
    dietary_restrictions: List[str] = []
    age_range: Optional[str] = None
    activity_level: Optional[str] = None
    health_goals: List[str] = []
    created_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecipeRequest(BaseModel):
    pantry_items: List[str]
    dietary_preference: str
    meal_type: Optional[str] = None
    servings: Optional[int] = 2
    health_profile_id: Optional[str] = None
    
class NutritionalBenefits(BaseModel):
    ingredient: str
    benefits: List[str]
    concerns: List[str]

class HealthWarning(BaseModel):
    category: str  # sodium, sugar, saturated_fat, etc.
    level: str  # low, moderate, high, very_high
    amount: str
    general_guidance: str
    condition_specific: dict  # {"hypertension": "guidance", "diabetes": "guidance"}

class Recipe(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image_url: Optional[str] = None  # URL to recipe image
    ingredients: List[dict]
    instructions: List[str]
    prep_time: str
    cook_time: str
    total_time: str
    servings: int
    difficulty: str
    dietary_tags: List[str]
    meal_type: str
    nutritional_info: dict
    additional_items_needed: List[str]
    nutritional_benefits: List[dict]  # Benefits of key ingredients
    health_warnings: List[dict]  # Warnings about sodium, sugar, etc.
    condition_suitability: dict  # Suitability for specific health conditions
    created_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_favorite: bool = False

class RecipeRating(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recipe_id: str
    rating: int
    review: Optional[str] = None
    created_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============= Helper Functions =============

async def fetch_unsplash_image(query: str) -> Optional[str]:
    """Fetch a random image from Unsplash for the given query"""
    try:
        # Using Unsplash Source API (no API key needed for basic usage)
        # Format: https://source.unsplash.com/800x600/?{query}
        # This returns a redirect to a random image matching the query
        base_url = "https://source.unsplash.com/800x600/"
        image_url = f"{base_url}?{query.replace(' ', ',')}"
        
        # Verify the URL works by making a HEAD request
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.head(image_url, follow_redirects=True)
            if response.status_code == 200:
                # Return the final URL after redirect
                return str(response.url)
        
        return image_url  # Return anyway, it should work
    except Exception as e:
        logging.error(f"Error fetching Unsplash image for '{query}': {str(e)}")
        # Return a default food placeholder
        return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"


async def generate_recipe_with_ai(pantry_items: List[str], dietary_preference: str, meal_type: str, servings: int, health_profile: Optional[HealthProfile] = None) -> dict:
    """Generate a recipe using OpenAI GPT-5.1 with health considerations"""
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    # Build health context
    health_context = ""
    if health_profile and health_profile.conditions:
        conditions_str = ", ".join(health_profile.conditions)
        health_context = f"""

IMPORTANT HEALTH CONSIDERATIONS:
- User has the following health conditions: {conditions_str}
- Recipe must be optimized for these conditions
- Provide specific warnings and modifications for each condition
- Flag any ingredients that may be contraindicated
"""
        if health_profile.allergies:
            health_context += f"\n- User is allergic to: {', '.join(health_profile.allergies)}"
        if health_profile.dietary_restrictions:
            health_context += f"\n- Additional dietary restrictions: {', '.join(health_profile.dietary_restrictions)}"
    
    # Create the prompt
    prompt = f"""You are a clinical nutritionist and expert chef. Create a detailed, health-focused {dietary_preference} recipe for {meal_type}.

Available ingredients: {', '.join(pantry_items)}
{health_context}

Requirements:
- Recipe must be {dietary_preference}
- Suitable for {meal_type}
- Serves {servings} people
- Use as many available ingredients as possible
- Include comprehensive nutritional analysis
- Provide detailed health benefits for key ingredients (especially herbs and spices)
- Flag any health concerns or warnings
- Include sodium content and warnings for various conditions
- Assess suitability for common health conditions

Return the recipe in this EXACT JSON format (no markdown, just pure JSON):
{{
    "title": "Recipe Name",
    "description": "Professional description focusing on nutritional value",
    "ingredients": [
        {{"item": "ingredient name", "amount": "quantity"}}
    ],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "prep_time": "X minutes",
    "cook_time": "X minutes",
    "total_time": "X minutes",
    "servings": {servings},
    "difficulty": "easy/medium/hard",
    "dietary_tags": ["{dietary_preference}"],
    "meal_type": "{meal_type}",
    "nutritional_info": {{
        "calories": 0,
        "protein": "0g",
        "carbs": "0g",
        "fat": "0g",
        "fiber": "0g",
        "sodium": "0mg",
        "sugar": "0g",
        "saturated_fat": "0g",
        "cholesterol": "0mg",
        "potassium": "0mg"
    }},
    "nutritional_benefits": [
        {{
            "ingredient": "ingredient name",
            "benefits": ["benefit 1", "benefit 2"],
            "concerns": ["concern 1 if any"]
        }}
    ],
    "health_warnings": [
        {{
            "category": "sodium/sugar/saturated_fat",
            "level": "low/moderate/high/very_high",
            "amount": "Xmg per serving",
            "general_guidance": "General population guidance",
            "condition_specific": {{
                "hypertension": "Specific guidance for high blood pressure",
                "diabetes": "Specific guidance for diabetes",
                "kidney_disease": "Specific guidance for kidney disease",
                "heart_disease": "Specific guidance for heart disease"
            }}
        }}
    ],
    "condition_suitability": {{
        "hypertension": {{"suitable": true/false, "notes": "explanation"}},
        "diabetes": {{"suitable": true/false, "notes": "explanation"}},
        "kidney_disease": {{"suitable": true/false, "notes": "explanation"}},
        "heart_disease": {{"suitable": true/false, "notes": "explanation"}},
        "cancer_prevention": {{"suitable": true/false, "notes": "explanation"}}
    }},
    "ingredients_used_from_pantry": ["ingredient1", "ingredient2"],
    "additional_items_needed": ["item1", "item2"]
}}

Provide accurate, evidence-based nutritional information and health guidance."""

    try:
        # Initialize LLM chat with faster model
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recipe-gen-{uuid.uuid4()}",
            system_message="You are a clinical nutritionist and expert chef specializing in evidence-based nutritional guidance and therapeutic diets."
        ).with_model("openai", "gpt-4o")
        
        # Send message
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        recipe_data = json.loads(response_text)
        return recipe_data
        
    except Exception as e:
        logging.error(f"Error generating recipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recipe: {str(e)}")


# ============= Initialize Ingredient Database =============

INGREDIENT_DATABASE = [
    # Vegetables
    {"name": "cucumber", "category": "vegetables"},
    {"name": "tomato", "category": "vegetables"},
    {"name": "onion", "category": "vegetables"},
    {"name": "garlic", "category": "vegetables"},
    {"name": "bell pepper", "category": "vegetables"},
    {"name": "hot pepper", "category": "vegetables"},
    {"name": "carrot", "category": "vegetables"},
    {"name": "broccoli", "category": "vegetables"},
    {"name": "spinach", "category": "vegetables"},
    {"name": "lettuce", "category": "vegetables"},
    {"name": "kale", "category": "vegetables"},
    {"name": "zucchini", "category": "vegetables"},
    {"name": "eggplant", "category": "vegetables"},
    {"name": "cauliflower", "category": "vegetables"},
    {"name": "mushroom", "category": "vegetables"},
    {"name": "pumpkin", "category": "vegetables"},
    {"name": "butternut squash", "category": "vegetables"},
    {"name": "sweet potato", "category": "vegetables"},
    {"name": "potato", "category": "vegetables"},
    {"name": "celery", "category": "vegetables"},
    {"name": "asparagus", "category": "vegetables"},
    {"name": "green beans", "category": "vegetables"},
    
    # Fruits
    {"name": "apple", "category": "fruits"},
    {"name": "banana", "category": "fruits"},
    {"name": "orange", "category": "fruits"},
    {"name": "lemon", "category": "fruits"},
    {"name": "lime", "category": "fruits"},
    {"name": "strawberry", "category": "fruits"},
    {"name": "blueberry", "category": "fruits"},
    {"name": "raspberry", "category": "fruits"},
    {"name": "mango", "category": "fruits"},
    {"name": "pineapple", "category": "fruits"},
    {"name": "watermelon", "category": "fruits"},
    {"name": "grapes", "category": "fruits"},
    {"name": "avocado", "category": "fruits"},
    {"name": "peach", "category": "fruits"},
    {"name": "pear", "category": "fruits"},
    
    # Grains & Starches
    {"name": "rice", "category": "grains"},
    {"name": "red rice", "category": "grains"},
    {"name": "brown rice", "category": "grains"},
    {"name": "quinoa", "category": "grains"},
    {"name": "oatmeal", "category": "grains"},
    {"name": "oats", "category": "grains"},
    {"name": "pasta", "category": "grains"},
    {"name": "bread", "category": "grains"},
    {"name": "pizza bread", "category": "grains"},
    {"name": "tortilla", "category": "grains"},
    {"name": "couscous", "category": "grains"},
    {"name": "barley", "category": "grains"},
    {"name": "flour", "category": "grains"},
    
    # Proteins
    {"name": "chickpeas", "category": "proteins"},
    {"name": "black beans", "category": "proteins"},
    {"name": "kidney beans", "category": "proteins"},
    {"name": "lentils", "category": "proteins"},
    {"name": "tofu", "category": "proteins"},
    {"name": "tempeh", "category": "proteins"},
    {"name": "edamame", "category": "proteins"},
    {"name": "hummus", "category": "proteins"},
    {"name": "peanut butter", "category": "proteins"},
    {"name": "almond butter", "category": "proteins"},
    {"name": "eggs", "category": "proteins"},
    {"name": "chicken", "category": "proteins"},
    {"name": "fish", "category": "proteins"},
    {"name": "salmon", "category": "proteins"},
    {"name": "tuna", "category": "proteins"},
    {"name": "shrimp", "category": "proteins"},
    
    # Dairy & Alternatives
    {"name": "yogurt", "category": "dairy"},
    {"name": "greek yogurt", "category": "dairy"},
    {"name": "milk", "category": "dairy"},
    {"name": "almond milk", "category": "dairy"},
    {"name": "oat milk", "category": "dairy"},
    {"name": "soy milk", "category": "dairy"},
    {"name": "cheese", "category": "dairy"},
    {"name": "cheddar cheese", "category": "dairy"},
    {"name": "mozzarella", "category": "dairy"},
    {"name": "parmesan", "category": "dairy"},
    {"name": "feta cheese", "category": "dairy"},
    {"name": "butter", "category": "dairy"},
    {"name": "cream cheese", "category": "dairy"},
    
    # Nuts & Seeds
    {"name": "almonds", "category": "nuts_seeds"},
    {"name": "walnuts", "category": "nuts_seeds"},
    {"name": "cashews", "category": "nuts_seeds"},
    {"name": "pecans", "category": "nuts_seeds"},
    {"name": "peanuts", "category": "nuts_seeds"},
    {"name": "chia seeds", "category": "nuts_seeds"},
    {"name": "flax seeds", "category": "nuts_seeds"},
    {"name": "sunflower seeds", "category": "nuts_seeds"},
    {"name": "pumpkin seeds", "category": "nuts_seeds"},
    
    # Spices & Herbs
    {"name": "salt", "category": "spices"},
    {"name": "black pepper", "category": "spices"},
    {"name": "cumin", "category": "spices"},
    {"name": "paprika", "category": "spices"},
    {"name": "turmeric", "category": "spices"},
    {"name": "cinnamon", "category": "spices"},
    {"name": "oregano", "category": "spices"},
    {"name": "basil", "category": "spices"},
    {"name": "thyme", "category": "spices"},
    {"name": "rosemary", "category": "spices"},
    {"name": "ginger", "category": "spices"},
    {"name": "chili powder", "category": "spices"},
    {"name": "cayenne pepper", "category": "spices"},
    
    # Condiments & Oils
    {"name": "olive oil", "category": "condiments"},
    {"name": "vegetable oil", "category": "condiments"},
    {"name": "coconut oil", "category": "condiments"},
    {"name": "sesame oil", "category": "condiments"},
    {"name": "soy sauce", "category": "condiments"},
    {"name": "vinegar", "category": "condiments"},
    {"name": "balsamic vinegar", "category": "condiments"},
    {"name": "apple cider vinegar", "category": "condiments"},
    {"name": "mustard", "category": "condiments"},
    {"name": "ketchup", "category": "condiments"},
    {"name": "mayonnaise", "category": "condiments"},
    {"name": "hot sauce", "category": "condiments"},
    {"name": "sriracha", "category": "condiments"},
    {"name": "honey", "category": "condiments"},
    {"name": "maple syrup", "category": "condiments"},
    {"name": "agave nectar", "category": "condiments"},
    
    # Canned & Packaged
    {"name": "canned tomatoes", "category": "canned"},
    {"name": "tomato paste", "category": "canned"},
    {"name": "tomato sauce", "category": "canned"},
    {"name": "coconut milk", "category": "canned"},
    {"name": "vegetable broth", "category": "canned"},
    {"name": "chicken broth", "category": "canned"},
]


@api_router.on_event("startup")
async def initialize_ingredients():
    """Initialize ingredient database if empty"""
    count = await db.ingredients.count_documents({})
    if count == 0:
        logging.info("Initializing ingredient database...")
        ingredients_with_ids = [
            {**ing, "id": str(uuid.uuid4())} for ing in INGREDIENT_DATABASE
        ]
        await db.ingredients.insert_many(ingredients_with_ids)
        logging.info(f"Initialized {len(INGREDIENT_DATABASE)} ingredients")


# ============= API Endpoints =============

@api_router.get("/")
async def root():
    return {"message": "Nutritional Recipe Generator API"}


# --- Ingredient Endpoints ---

@api_router.get("/ingredients", response_model=List[Ingredient])
async def get_all_ingredients(category: Optional[str] = None, search: Optional[str] = None):
    """Get all ingredients with optional filtering"""
    query = {}
    if category:
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    ingredients = await db.ingredients.find(query, {"_id": 0}).to_list(1000)
    return ingredients


@api_router.get("/ingredients/categories")
async def get_ingredient_categories():
    """Get all unique ingredient categories"""
    categories = await db.ingredients.distinct("category")
    return {"categories": categories}


@api_router.post("/ingredients", response_model=Ingredient)
async def add_custom_ingredient(ingredient: Ingredient):
    """Add a custom ingredient to the global database"""
    # Check if ingredient already exists
    existing = await db.ingredients.find_one({"name": ingredient.name.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Ingredient already exists")
    
    # Create new ingredient
    ingredient.name = ingredient.name.lower()
    doc = ingredient.model_dump()
    
    await db.ingredients.insert_one(doc)
    logging.info(f"New ingredient added: {ingredient.name} in category {ingredient.category}")
    
    return ingredient


# --- Pantry Endpoints ---

@api_router.get("/pantry", response_model=List[PantryItem])
async def get_pantry():
    """Get all items in user's pantry"""
    items = await db.pantry.find({}, {"_id": 0}).to_list(1000)
    
    for item in items:
        if isinstance(item.get('added_date'), str):
            item['added_date'] = datetime.fromisoformat(item['added_date'])
    
    return items


@api_router.post("/pantry", response_model=PantryItem)
async def add_to_pantry(item: PantryItem):
    """Add an item to pantry"""
    doc = item.model_dump()
    doc['added_date'] = doc['added_date'].isoformat()
    
    await db.pantry.insert_one(doc)
    return item


@api_router.delete("/pantry/{item_id}")
async def remove_from_pantry(item_id: str):
    """Remove an item from pantry"""
    result = await db.pantry.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item removed from pantry"}


@api_router.delete("/pantry")
async def clear_pantry():
    """Clear all items from pantry"""
    await db.pantry.delete_many({})
    return {"message": "Pantry cleared"}


# --- Health Profile Endpoints ---

@api_router.get("/health-profile", response_model=HealthProfile)
async def get_health_profile():
    """Get user's health profile"""
    profile = await db.health_profiles.find_one({}, {"_id": 0})
    if not profile:
        # Return empty profile if none exists
        return HealthProfile()
    
    if isinstance(profile.get('created_date'), str):
        profile['created_date'] = datetime.fromisoformat(profile['created_date'])
    if isinstance(profile.get('updated_date'), str):
        profile['updated_date'] = datetime.fromisoformat(profile['updated_date'])
    
    return profile


@api_router.post("/health-profile", response_model=HealthProfile)
async def create_or_update_health_profile(profile: HealthProfile):
    """Create or update health profile"""
    # Delete existing profile
    await db.health_profiles.delete_many({})
    
    # Create new profile
    profile.updated_date = datetime.now(timezone.utc)
    doc = profile.model_dump()
    doc['created_date'] = doc['created_date'].isoformat()
    doc['updated_date'] = doc['updated_date'].isoformat()
    
    await db.health_profiles.insert_one(doc)
    return profile


# --- Recipe Generation Endpoints ---

@api_router.post("/recipes/generate", response_model=Recipe)
async def generate_recipe(request: RecipeRequest):
    """Generate a recipe based on pantry items and preferences"""
    
    if not request.pantry_items:
        raise HTTPException(status_code=400, detail="No pantry items provided")
    
    meal_type = request.meal_type or "any meal"
    
    # Get health profile if specified
    health_profile = None
    if request.health_profile_id:
        profile_doc = await db.health_profiles.find_one({"id": request.health_profile_id}, {"_id": 0})
        if profile_doc:
            if isinstance(profile_doc.get('created_date'), str):
                profile_doc['created_date'] = datetime.fromisoformat(profile_doc['created_date'])
            if isinstance(profile_doc.get('updated_date'), str):
                profile_doc['updated_date'] = datetime.fromisoformat(profile_doc['updated_date'])
            health_profile = HealthProfile(**profile_doc)
    else:
        # Get default health profile
        profile_doc = await db.health_profiles.find_one({}, {"_id": 0})
        if profile_doc:
            if isinstance(profile_doc.get('created_date'), str):
                profile_doc['created_date'] = datetime.fromisoformat(profile_doc['created_date'])
            if isinstance(profile_doc.get('updated_date'), str):
                profile_doc['updated_date'] = datetime.fromisoformat(profile_doc['updated_date'])
            health_profile = HealthProfile(**profile_doc)
    
    # Generate recipe using AI
    recipe_data = await generate_recipe_with_ai(
        pantry_items=request.pantry_items,
        dietary_preference=request.dietary_preference,
        meal_type=meal_type,
        servings=request.servings,
        health_profile=health_profile
    )
    
    # Fetch recipe image based on title and main ingredients
    recipe_image_query = f"{recipe_data['title']} food dish"
    recipe_image_url = await fetch_unsplash_image(recipe_image_query)
    
    # Create Recipe object
    recipe = Recipe(
        title=recipe_data["title"],
        description=recipe_data["description"],
        image_url=recipe_image_url,
        ingredients=recipe_data["ingredients"],
        instructions=recipe_data["instructions"],
        prep_time=recipe_data["prep_time"],
        cook_time=recipe_data["cook_time"],
        total_time=recipe_data["total_time"],
        servings=recipe_data["servings"],
        difficulty=recipe_data["difficulty"],
        dietary_tags=recipe_data["dietary_tags"],
        meal_type=recipe_data["meal_type"],
        nutritional_info=recipe_data["nutritional_info"],
        additional_items_needed=recipe_data.get("additional_items_needed", []),
        nutritional_benefits=recipe_data.get("nutritional_benefits", []),
        health_warnings=recipe_data.get("health_warnings", []),
        condition_suitability=recipe_data.get("condition_suitability", {})
    )
    
    # Save to database
    doc = recipe.model_dump()
    doc['created_date'] = doc['created_date'].isoformat()
    await db.recipes.insert_one(doc)
    
    return recipe


@api_router.get("/recipes", response_model=List[Recipe])
async def get_all_recipes(favorites_only: bool = False):
    """Get all saved recipes"""
    query = {}
    if favorites_only:
        query["is_favorite"] = True
    
    recipes = await db.recipes.find(query, {"_id": 0}).sort("created_date", -1).to_list(100)
    
    for recipe in recipes:
        if isinstance(recipe.get('created_date'), str):
            recipe['created_date'] = datetime.fromisoformat(recipe['created_date'])
    
    return recipes


@api_router.get("/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    """Get a specific recipe by ID"""
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    if isinstance(recipe.get('created_date'), str):
        recipe['created_date'] = datetime.fromisoformat(recipe['created_date'])
    
    return recipe


@api_router.patch("/recipes/{recipe_id}/favorite")
async def toggle_favorite(recipe_id: str, is_favorite: bool):
    """Toggle favorite status of a recipe"""
    result = await db.recipes.update_one(
        {"id": recipe_id},
        {"$set": {"is_favorite": is_favorite}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Favorite status updated"}


@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str):
    """Delete a recipe"""
    result = await db.recipes.delete_one({"id": recipe_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Recipe deleted"}


# --- Recipe Rating Endpoints ---

@api_router.post("/recipes/{recipe_id}/ratings", response_model=RecipeRating)
async def add_recipe_rating(recipe_id: str, rating: RecipeRating):
    """Add a rating/review to a recipe"""
    rating.recipe_id = recipe_id
    doc = rating.model_dump()
    doc['created_date'] = doc['created_date'].isoformat()
    
    await db.recipe_ratings.insert_one(doc)
    return rating


@api_router.get("/recipes/{recipe_id}/ratings", response_model=List[RecipeRating])
async def get_recipe_ratings(recipe_id: str):
    """Get all ratings for a recipe"""
    ratings = await db.recipe_ratings.find({"recipe_id": recipe_id}, {"_id": 0}).to_list(100)
    
    for rating in ratings:
        if isinstance(rating.get('created_date'), str):
            rating['created_date'] = datetime.fromisoformat(rating['created_date'])
    
    return ratings


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
