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
    
class PantryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ingredient_name: str
    quantity: Optional[str] = None
    notes: Optional[str] = None  # "soft", "fresh", etc.
    added_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecipeRequest(BaseModel):
    pantry_items: List[str]  # List of ingredient names
    dietary_preference: str  # vegan, vegetarian, pescatarian, flexitarian, carnivorous, plant-based, clean-eating
    meal_type: Optional[str] = None  # breakfast, lunch, dinner, snack, dessert
    servings: Optional[int] = 2
    
class Recipe(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    ingredients: List[dict]  # [{"item": "cucumber", "amount": "2 cups"}]
    instructions: List[str]
    prep_time: str
    cook_time: str
    total_time: str
    servings: int
    difficulty: str  # easy, medium, hard
    dietary_tags: List[str]
    meal_type: str
    nutritional_info: dict  # calories, protein, carbs, fat, fiber
    additional_items_needed: List[str]  # Items not in pantry
    created_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_favorite: bool = False

class RecipeRating(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recipe_id: str
    rating: int  # 1-5
    review: Optional[str] = None
    created_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============= Helper Functions =============

async def generate_recipe_with_ai(pantry_items: List[str], dietary_preference: str, meal_type: str, servings: int) -> dict:
    """Generate a recipe using OpenAI GPT-5.1"""
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    # Create the prompt
    prompt = f"""You are an expert chef and nutritionist. Create a detailed, delicious {dietary_preference} recipe for {meal_type}.

Available ingredients: {', '.join(pantry_items)}

Requirements:
- Recipe must be {dietary_preference}
- Suitable for {meal_type}
- Serves {servings} people
- Use as many of the available ingredients as possible
- Specify which ingredients from the list you're using
- List any additional common ingredients needed
- Include detailed nutritional information (calories, protein, carbs, fat, fiber per serving)
- Rate the difficulty level (easy/medium/hard)
- Provide prep time, cook time, and total time

Return the recipe in this EXACT JSON format (no markdown, just pure JSON):
{{
    "title": "Recipe Name",
    "description": "Brief appetizing description",
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
        "fiber": "0g"
    }},
    "ingredients_used_from_pantry": ["ingredient1", "ingredient2"],
    "additional_items_needed": ["item1", "item2"]
}}"""

    try:
        # Initialize LLM chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recipe-gen-{uuid.uuid4()}",
            system_message="You are an expert chef and nutritionist specializing in creating delicious, healthy recipes."
        ).with_model("openai", "gpt-5.1")
        
        # Send message
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        # Extract JSON from response (handle markdown code blocks if present)
        response_text = response.strip()
        if response_text.startswith("```"):
            # Remove markdown code blocks
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
    return {"message": "Smart Recipe Generator API"}


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


# --- Pantry Endpoints ---

@api_router.get("/pantry", response_model=List[PantryItem])
async def get_pantry():
    """Get all items in user's pantry"""
    items = await db.pantry.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
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


# --- Recipe Generation Endpoints ---

@api_router.post("/recipes/generate", response_model=Recipe)
async def generate_recipe(request: RecipeRequest):
    """Generate a recipe based on pantry items and preferences"""
    
    if not request.pantry_items:
        raise HTTPException(status_code=400, detail="No pantry items provided")
    
    meal_type = request.meal_type or "any meal"
    
    # Generate recipe using AI
    recipe_data = await generate_recipe_with_ai(
        pantry_items=request.pantry_items,
        dietary_preference=request.dietary_preference,
        meal_type=meal_type,
        servings=request.servings
    )
    
    # Create Recipe object
    recipe = Recipe(
        title=recipe_data["title"],
        description=recipe_data["description"],
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
        additional_items_needed=recipe_data.get("additional_items_needed", [])
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
    
    # Convert ISO string timestamps back to datetime objects
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
    
    # Convert ISO string timestamps
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
