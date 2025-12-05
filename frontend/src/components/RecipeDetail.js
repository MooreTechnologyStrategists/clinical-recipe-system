import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecipeDetail = ({ apiUrl, recipe, onBack }) => {
  const [ratings, setRatings] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newReview, setNewReview] = useState('');
  const [isFavorite, setIsFavorite] = useState(recipe.is_favorite);
  const [saved, setSaved] = useState(false);

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
      easy: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      hard: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[difficulty.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getWarningLevel = (level) => {
    const classes = {
      low: 'health-warning low border-green-500',
      moderate: 'health-warning moderate border-yellow-500',
      high: 'health-warning high border-orange-500',
      very_high: 'health-warning high border-red-500',
    };
    return classes[level] || 'health-warning moderate border-yellow-500';
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-semibold text-gray-900 mb-2" data-testid="recipe-detail-title">
              {recipe.title}
            </h1>
            <p className="text-lg text-gray-600">{recipe.description}</p>
          </div>
          <button
            onClick={toggleFavorite}
            data-testid="favorite-toggle-btn"
            className="text-5xl hover:scale-110 transition-transform ml-4"
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        {/* Tags and Meta Info */}
        <div className="flex flex-wrap gap-3 mb-6">
          <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getDifficultyColor(recipe.difficulty)}`}>
            Difficulty: {recipe.difficulty}
          </span>
          <span className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
            Meal Type: {recipe.meal_type}
          </span>
          {recipe.dietary_tags && recipe.dietary_tags.map((tag, idx) => (
            <span key={idx} className="px-3 py-1 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
              {tag}
            </span>
          ))}
        </div>

        {/* Time Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Prep Time</div>
            <div className="font-semibold text-gray-900">{recipe.prep_time}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Cook Time</div>
            <div className="font-semibold text-gray-900">{recipe.cook_time}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Time</div>
            <div className="font-semibold text-gray-900">{recipe.total_time}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Servings</div>
            <div className="font-semibold text-gray-900">{recipe.servings}</div>
          </div>
        </div>

        {/* Nutritional Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutritional Information (per serving)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-testid="nutrition-info">
            <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
              <div className="text-sm text-gray-600">Calories</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.calories}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
              <div className="text-sm text-gray-600">Protein</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.protein}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
              <div className="text-sm text-gray-600">Carbs</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.carbs}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
              <div className="text-sm text-gray-600">Fat</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.fat}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
              <div className="text-sm text-gray-600">Fiber</div>
              <div className="text-xl font-bold text-gray-900">{recipe.nutritional_info.fiber}</div>
            </div>
          </div>
          
          {recipe.nutritional_info.sodium && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
                <div className="text-sm text-gray-600">Sodium</div>
                <div className="text-lg font-bold text-gray-900">{recipe.nutritional_info.sodium}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
                <div className="text-sm text-gray-600">Sugar</div>
                <div className="text-lg font-bold text-gray-900">{recipe.nutritional_info.sugar}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
                <div className="text-sm text-gray-600">Saturated Fat</div>
                <div className="text-lg font-bold text-gray-900">{recipe.nutritional_info.saturated_fat}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
                <div className="text-sm text-gray-600">Cholesterol</div>
                <div className="text-lg font-bold text-gray-900">{recipe.nutritional_info.cholesterol}</div>
              </div>
            </div>
          )}
        </div>

        {/* Health Warnings */}
        {recipe.health_warnings && recipe.health_warnings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Considerations</h3>
            <div className="space-y-3" data-testid="health-warnings">
              {recipe.health_warnings.map((warning, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${getWarningLevel(warning.level)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {warning.category.replace('_', ' ')}: {warning.level.replace('_', ' ')}
                    </h4>
                    <span className="text-sm font-medium text-gray-700">{warning.amount}</span>
                  </div>
                  <p className="text-sm text-gray-800 mb-3">{warning.general_guidance}</p>
                  
                  {warning.condition_specific && Object.keys(warning.condition_specific).length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-900">Condition-Specific Guidance:</p>
                      {Object.entries(warning.condition_specific).map(([condition, guidance]) => (
                        <div key={condition} className="ml-4 text-sm text-gray-800">
                          <span className="font-medium capitalize">{condition.replace('_', ' ')}:</span> {guidance}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nutritional Benefits */}
        {recipe.nutritional_benefits && recipe.nutritional_benefits.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutritional Benefits of Key Ingredients</h3>
            <div className="space-y-3" data-testid="nutritional-benefits">
              {recipe.nutritional_benefits.map((benefit, idx) => (
                <div key={idx} className="benefit-card p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 capitalize mb-2">{benefit.ingredient}</h4>
                  {benefit.benefits && benefit.benefits.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Benefits:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {benefit.benefits.map((b, bidx) => (
                          <li key={bidx} className="text-sm text-gray-800">{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {benefit.concerns && benefit.concerns.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-orange-700 mb-1">Concerns:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {benefit.concerns.map((c, cidx) => (
                          <li key={cidx} className="text-sm text-orange-800">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Condition Suitability */}
        {recipe.condition_suitability && Object.keys(recipe.condition_suitability).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suitability for Health Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="condition-suitability">
              {Object.entries(recipe.condition_suitability).map(([condition, info]) => (
                <div
                  key={condition}
                  className={`p-4 rounded-lg border-2 ${
                    info.suitable
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {condition.replace('_', ' ')}
                    </h4>
                    <span className={`text-lg ${
                      info.suitable ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {info.suitable ? '✓' : '✗'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{info.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Items Needed */}
        {recipe.additional_items_needed && recipe.additional_items_needed.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6" data-testid="additional-items">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Items Needed</h3>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4" data-testid="ingredients-section">
            Ingredients
          </h2>
          <ul className="space-y-3">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                <span className="text-green-600 mt-1">✓</span>
                <span className="flex-1">
                  <span className="font-medium text-gray-900">{ing.amount}</span>
                  <span className="text-gray-700 ml-2">{ing.item}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4" data-testid="instructions-section">
            Instructions
          </h2>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction, idx) => (
              <li key={idx} className="flex space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {idx + 1}
                </span>
                <p className="flex-1 text-gray-700 pt-1">{instruction}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Ratings and Reviews */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900" data-testid="ratings-section">
            Ratings & Reviews
          </h2>
          {ratings.length > 0 && (
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{averageRating}</div>
              <div className="text-sm text-gray-600">{ratings.length} review{ratings.length !== 1 ? 's' : ''}</div>
            </div>
          )}
        </div>

        {/* Add Rating Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Add Your Review</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewRating(star)}
                    data-testid={`rating-star-${star}-btn`}
                    className="text-3xl hover:scale-110 transition-transform"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={submitRating}
              data-testid="submit-review-btn"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
              <div key={rating.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
