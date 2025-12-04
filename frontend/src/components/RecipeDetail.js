import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecipeDetail = ({ apiUrl, recipe, onBack }) => {
  const [ratings, setRatings] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newReview, setNewReview] = useState('');
  const [isFavorite, setIsFavorite] = useState(recipe.is_favorite);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const response = await axios.get(`${apiUrl}/recipes/${recipe.id}/ratings`);
      setRatings(response.data);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const submitRating = async () => {
    if (!newReview.trim()) {
      alert('Please enter a review');
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/recipes/${recipe.id}/ratings`, {
        rating: newRating,
        review: newReview,
      });
      setRatings([...ratings, response.data]);
      setNewRating(5);
      setNewReview('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    }
  };

  const toggleFavorite = async () => {
    try {
      await axios.patch(`${apiUrl}/recipes/${recipe.id}/favorite?is_favorite=${!isFavorite}`);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
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

  const averageRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        data-testid="back-to-recipes-btn"
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span className="text-xl">←</span>
        <span>Back to Recipes</span>
      </button>

      {/* Recipe Header */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid="recipe-detail-title">
              {recipe.title}
            </h1>
            <p className="text-lg text-gray-600">{recipe.description}</p>
          </div>
          <button
            onClick={toggleFavorite}
            data-testid="favorite-toggle-btn"
            className="text-5xl hover:scale-125 transition-transform ml-4"
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        {/* Tags and Meta Info */}
        <div className="flex flex-wrap gap-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(recipe.difficulty)}`}>
            📈 {recipe.difficulty}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            🍽️ {recipe.meal_type}
          </span>
          {recipe.dietary_tags.map((tag, idx) => (
            <span key={idx} className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              🌱 {tag}
            </span>
          ))}
        </div>

        {/* Time Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🕒</div>
            <div className="text-xs text-gray-600">Prep Time</div>
            <div className="font-bold text-gray-900">{recipe.prep_time}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🍳</div>
            <div className="text-xs text-gray-600">Cook Time</div>
            <div className="font-bold text-gray-900">{recipe.cook_time}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">⏰</div>
            <div className="text-xs text-gray-600">Total Time</div>
            <div className="font-bold text-gray-900">{recipe.total_time}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🍽️</div>
            <div className="text-xs text-gray-600">Servings</div>
            <div className="font-bold text-gray-900">{recipe.servings}</div>
          </div>
        </div>

        {/* Nutritional Information */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Nutritional Information (per serving)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-testid="nutrition-info">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-sm text-gray-600">Calories</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.calories}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-sm text-gray-600">Protein</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.protein}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-sm text-gray-600">Carbs</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.carbs}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-sm text-gray-600">Fat</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.fat}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-sm text-gray-600">Fiber</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.fiber}</div>
            </div>
          </div>
        </div>

        {/* Additional Items Needed */}
        {recipe.additional_items_needed && recipe.additional_items_needed.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6" data-testid="additional-items">
            <h3 className="text-lg font-bold text-gray-900 mb-2">🛍️ Additional Items Needed</h3>
            <ul className="list-disc list-inside space-y-1">
              {recipe.additional_items_needed.map((item, idx) => (
                <li key={idx} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Ingredients and Instructions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ingredients */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4" data-testid="ingredients-section">
            🧂 Ingredients
          </h2>
          <ul className="space-y-3">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                <span className="text-green-500 mt-1">✓</span>
                <span className="flex-1">
                  <span className="font-medium text-gray-900">{ing.amount}</span>
                  <span className="text-gray-700 ml-2">{ing.item}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4" data-testid="instructions-section">
            📝 Instructions
          </h2>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction, idx) => (
              <li key={idx} className="flex space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <p className="flex-1 text-gray-700 pt-1">{instruction}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Ratings and Reviews */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="ratings-section">
            ⭐ Ratings & Reviews
          </h2>
          {ratings.length > 0 && (
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{averageRating}</div>
              <div className="text-sm text-gray-600">{ratings.length} review{ratings.length !== 1 ? 's' : ''}</div>
            </div>
          )}
        </div>

        {/* Add Rating Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Add Your Review</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewRating(star)}
                    data-testid={`rating-star-${star}-btn`}
                    className="text-3xl hover:scale-125 transition-transform"
                  >
                    {star <= newRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                data-testid="review-textarea"
                placeholder="Share your thoughts about this recipe..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={submitRating}
              data-testid="submit-review-btn"
              className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              Submit Review
            </button>
          </div>
        </div>

        {/* Existing Reviews */}
        <div className="space-y-4" data-testid="reviews-list">
          {ratings.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No reviews yet. Be the first to review!</p>
          ) : (
            ratings.map((rating) => (
              <div key={rating.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, idx) => (
                      <span key={idx} className="text-xl">
                        {idx < rating.rating ? '⭐' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(rating.created_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{rating.review}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
