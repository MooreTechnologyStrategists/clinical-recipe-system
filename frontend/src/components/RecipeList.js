import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecipeList = ({ apiUrl, onViewRecipe }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, [showFavoritesOnly]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/recipes`, {
        params: { favorites_only: showFavoritesOnly }
      });
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (recipeId, currentStatus) => {
    try {
      await axios.patch(`${apiUrl}/recipes/${recipeId}/favorite?is_favorite=${!currentStatus}`);
      // Update local state
      setRecipes(recipes.map(recipe => 
        recipe.id === recipeId ? { ...recipe, is_favorite: !currentStatus } : recipe
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteRecipe = async (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await axios.delete(`${apiUrl}/recipes/${recipeId}`);
        setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe');
      }
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800',
    };
    return colors[difficulty.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="loading-recipes">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900" data-testid="saved-recipes-title">
            Saved Recipes ({recipes.length})
          </h2>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            data-testid="toggle-favorites-btn"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showFavoritesOnly
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showFavoritesOnly ? 'Favorites Only' : 'All Recipes'}
          </button>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-12 text-gray-500" data-testid="no-recipes-message">
            <div className="text-6xl mb-4">🍳</div>
            <p className="text-lg font-medium">
              {showFavoritesOnly ? 'No favorite recipes yet!' : 'No recipes saved yet!'}
            </p>
            <p className="text-sm mt-2">
              {showFavoritesOnly 
                ? 'Mark some recipes as favorites to see them here.' 
                : 'Generate some recipes to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="recipes-grid">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                data-testid={`recipe-card-${recipe.id}`}
                className="recipe-card bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-green-400 cursor-pointer"
              >
                <div className="p-5 space-y-3">
                  {/* Header with favorite button */}
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2">
                      {recipe.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id, recipe.is_favorite);
                      }}
                      data-testid={`favorite-btn-${recipe.id}`}
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {recipe.is_favorite ? '⭐' : '☆'}
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                      {recipe.difficulty}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {recipe.meal_type}
                    </span>
                    {recipe.dietary_tags.slice(0, 1).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Time and Servings */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>⏱️ {recipe.total_time}</span>
                    <span>🍽️ {recipe.servings} servings</span>
                  </div>

                  {/* Nutrition Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-600">Calories:</span>
                      <span className="font-medium ml-1">{recipe.nutritional_info.calories}</span>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-600">Protein:</span>
                      <span className="font-medium ml-1">{recipe.nutritional_info.protein}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => onViewRecipe(recipe)}
                      data-testid={`view-recipe-btn-${recipe.id}`}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                    >
                      View Recipe
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecipe(recipe.id);
                      }}
                      data-testid={`delete-recipe-btn-${recipe.id}`}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeList;
