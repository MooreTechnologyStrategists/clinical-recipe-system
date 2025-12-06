import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecipeList = ({ apiUrl, onViewRecipe }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, title
  const [filterDiet, setFilterDiet] = useState('all');
  const [filterMeal, setFilterMeal] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    if (window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
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

  // Filter and sort recipes
  const filteredAndSortedRecipes = recipes
    .filter(recipe => {
      // Search filter
      if (searchQuery && !recipe.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Diet filter
      if (filterDiet !== 'all' && !recipe.dietary_tags.includes(filterDiet)) {
        return false;
      }
      // Meal filter
      if (filterMeal !== 'all' && recipe.meal_type !== filterMeal) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'date-asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const dietaryOptions = ['all', 'vegan', 'vegetarian', 'plant-based', 'pescatarian', 'flexitarian', 'carnivorous', 'clean-eating'];
  const mealOptions = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'];

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
        {/* Header with Stats */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900" data-testid="saved-recipes-title">
              Recipe Collection
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredAndSortedRecipes.length} recipe{filteredAndSortedRecipes.length !== 1 ? 's' : ''} 
              {searchQuery || filterDiet !== 'all' || filterMeal !== 'all' ? ' (filtered)' : ''}
              {showFavoritesOnly ? ' • Favorites only' : ` • ${recipes.filter(r => r.is_favorite).length} favorites`}
            </p>
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            data-testid="toggle-favorites-btn"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showFavoritesOnly
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showFavoritesOnly ? '⭐ Favorites' : 'All Recipes'}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search recipes by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-recipes-input"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                data-testid="sort-select"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>

            {/* Dietary Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Type</label>
              <select
                value={filterDiet}
                onChange={(e) => setFilterDiet(e.target.value)}
                data-testid="diet-filter-select"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {dietaryOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Diets' : option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Meal Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <select
                value={filterMeal}
                onChange={(e) => setFilterMeal(e.target.value)}
                data-testid="meal-filter-select"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {mealOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Meals' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || filterDiet !== 'all' || filterMeal !== 'all') && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterDiet('all');
                  setFilterMeal('all');
                }}
                data-testid="clear-filters-btn"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Recipe Grid */}
        {filteredAndSortedRecipes.length === 0 ? (
          <div className="text-center py-12 text-gray-500" data-testid="no-recipes-message">
            <p className="text-lg font-medium">
              {recipes.length === 0 
                ? (showFavoritesOnly ? 'No favorite recipes' : 'No saved recipes')
                : 'No recipes match your filters'
              }
            </p>
            <p className="text-sm mt-2">
              {recipes.length === 0
                ? (showFavoritesOnly 
                  ? 'Mark recipes as favorites to see them here.' 
                  : 'Generate recipes to add them to your collection.')
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="recipes-grid">
            {filteredAndSortedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                data-testid={`recipe-card-${recipe.id}`}
                className="recipe-card bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="p-5 space-y-3">
                  {/* Header with favorite button */}
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2 line-clamp-2">
                      {recipe.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id, recipe.is_favorite);
                      }}
                      data-testid={`favorite-btn-${recipe.id}`}
                      className="text-2xl hover:scale-125 transition-transform flex-shrink-0"
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
                    {recipe.dietary_tags && recipe.dietary_tags.slice(0, 1).map((tag, idx) => (
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

                  {/* Date Created */}
                  <div className="text-xs text-gray-400">
                    Created: {new Date(recipe.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      View Recipe
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecipe(recipe.id);
                      }}
                      data-testid={`delete-recipe-btn-${recipe.id}`}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors text-sm"
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

      {/* Recipe Statistics */}
      {recipes.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Recipe Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{recipes.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Recipes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{recipes.filter(r => r.is_favorite).length}</div>
              <div className="text-sm text-gray-600 mt-1">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {recipes.filter(r => r.dietary_tags.includes('vegan') || r.dietary_tags.includes('vegetarian') || r.dietary_tags.includes('plant-based')).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Plant-Based</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {[...new Set(recipes.flatMap(r => r.dietary_tags))].length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Diet Types</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeList;
