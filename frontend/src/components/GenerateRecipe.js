import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GenerateRecipe = ({ apiUrl, pantryItems, healthProfile, onRecipeGenerated }) => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [dietaryPreference, setDietaryPreference] = useState('plant-based');
  const [mealType, setMealType] = useState('lunch');
  const [servings, setServings] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-select all pantry items
    setSelectedIngredients(pantryItems.map(item => item.ingredient_name));
  }, [pantryItems]);

  const toggleIngredient = (ingredientName) => {
    if (selectedIngredients.includes(ingredientName)) {
      setSelectedIngredients(selectedIngredients.filter(name => name !== ingredientName));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredientName]);
    }
  };

  const generateRecipe = async () => {
    if (selectedIngredients.length === 0) {
      setError('Please select at least one ingredient');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${apiUrl}/recipes/generate`, {
        pantry_items: selectedIngredients,
        dietary_preference: dietaryPreference,
        meal_type: mealType,
        servings: servings,
        health_profile_id: healthProfile?.id,
      });

      onRecipeGenerated(response.data);
    } catch (error) {
      console.error('Error generating recipe:', error);
      setError(error.response?.data?.detail || 'Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const dietaryOptions = [
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'plant-based', label: 'Plant-Based' },
    { value: 'pescatarian', label: 'Pescatarian' },
    { value: 'flexitarian', label: 'Flexitarian' },
    { value: 'carnivorous', label: 'Carnivorous' },
    { value: 'clean-eating', label: 'Clean Eating' },
  ];

  const mealTypeOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'dessert', label: 'Dessert' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6" data-testid="generate-recipe-title">
          Generate Recipe
        </h2>
        
        {healthProfile && healthProfile.conditions && healthProfile.conditions.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">
              Health Profile Active
            </p>
            <p className="text-sm text-blue-800">
              Recipes will be optimized for: {healthProfile.conditions.join(', ')}
            </p>
          </div>
        )}

        {pantryItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500" data-testid="no-pantry-items-message">
            <p className="text-lg font-medium">No ingredients in inventory</p>
            <p className="text-sm mt-2">Add ingredients to your inventory first to generate recipes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Ingredients ({selectedIngredients.length} selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-testid="ingredient-selector-grid">
                {pantryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleIngredient(item.ingredient_name)}
                    data-testid={`select-ingredient-${item.ingredient_name}-btn`}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      selectedIngredients.includes(item.ingredient_name)
                        ? 'bg-blue-600 text-white border-2 border-blue-700'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {selectedIngredients.includes(item.ingredient_name) && '✓ '}
                    {item.ingredient_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dietary Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-testid="dietary-preference-grid">
                {dietaryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDietaryPreference(option.value)}
                    data-testid={`dietary-${option.value}-btn`}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      dietaryPreference === option.value
                        ? 'bg-green-500 text-white border-2 border-green-600'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Meal Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" data-testid="meal-type-grid">
                {mealTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMealType(option.value)}
                    data-testid={`meal-type-${option.value}-btn`}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      mealType === option.value
                        ? 'bg-green-500 text-white border-2 border-green-600'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Servings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Number of Servings
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  data-testid="decrease-servings-btn"
                  className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-lg"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-gray-900 w-12 text-center" data-testid="servings-display">
                  {servings}
                </span>
                <button
                  onClick={() => setServings(servings + 1)}
                  data-testid="increase-servings-btn"
                  className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg" data-testid="error-message">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateRecipe}
              disabled={loading || selectedIngredients.length === 0}
              data-testid="generate-recipe-btn"
              className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-lg text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="loader"></div>
                  <span>Generating Amazing Recipe...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Generate Recipe</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateRecipe;
