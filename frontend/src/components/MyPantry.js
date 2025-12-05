import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyPantry = ({ apiUrl, pantryItems, setPantryItems }) => {
  const [allIngredients, setAllIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customIngredientName, setCustomIngredientName] = useState('');
  const [customIngredientCategory, setCustomIngredientCategory] = useState('other');
  const [addingCustom, setAddingCustom] = useState(false);

  useEffect(() => {
    fetchAllIngredients();
    fetchCategories();
    fetchPantryItems();
  }, []);

  const fetchAllIngredients = async () => {
    try {
      const response = await axios.get(`${apiUrl}/ingredients`);
      setAllIngredients(response.data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/ingredients/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPantryItems = async () => {
    try {
      const response = await axios.get(`${apiUrl}/pantry`);
      setPantryItems(response.data);
    } catch (error) {
      console.error('Error fetching pantry:', error);
    }
  };

  const addToPantry = async (ingredientName) => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiUrl}/pantry`, {
        ingredient_name: ingredientName,
      });
      setPantryItems([...pantryItems, response.data]);
    } catch (error) {
      console.error('Error adding to pantry:', error);
      alert('Failed to add item to pantry');
    } finally {
      setLoading(false);
    }
  };

  const removeFromPantry = async (itemId) => {
    try {
      await axios.delete(`${apiUrl}/pantry/${itemId}`);
      setPantryItems(pantryItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing from pantry:', error);
      alert('Failed to remove item from pantry');
    }
  };

  const clearPantry = async () => {
    if (window.confirm('Are you sure you want to clear your entire inventory?')) {
      try {
        await axios.delete(`${apiUrl}/pantry`);
        setPantryItems([]);
      } catch (error) {
        console.error('Error clearing pantry:', error);
        alert('Failed to clear pantry');
      }
    }
  };

  const addCustomIngredient = async () => {
    if (!customIngredientName.trim()) {
      alert('Please enter an ingredient name');
      return;
    }

    try {
      setAddingCustom(true);
      // Add to global ingredient database
      const response = await axios.post(`${apiUrl}/ingredients`, {
        name: customIngredientName.toLowerCase().trim(),
        category: customIngredientCategory
      });
      
      // Refresh ingredients list
      await fetchAllIngredients();
      
      // Add to pantry
      await addToPantry(customIngredientName.toLowerCase().trim());
      
      // Reset form
      setCustomIngredientName('');
      setCustomIngredientCategory('other');
      setShowAddCustom(false);
      
      alert('Custom ingredient added and available to all users!');
    } catch (error) {
      console.error('Error adding custom ingredient:', error);
      if (error.response?.status === 409) {
        alert('This ingredient already exists!');
      } else {
        alert('Failed to add custom ingredient');
      }
    } finally {
      setAddingCustom(false);
    }
  };

  const filteredIngredients = allIngredients.filter(ing => {
    const matchesCategory = selectedCategory === 'all' || ing.category === selectedCategory;
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const notInPantry = !pantryItems.some(item => item.ingredient_name === ing.name);
    return matchesCategory && matchesSearch && notInPantry;
  });

  const getCategoryLabel = (category) => {
    const labels = {
      vegetables: 'Vegetables',
      fruits: 'Fruits',
      grains: 'Grains',
      proteins: 'Proteins',
      dairy: 'Dairy',
      nuts_seeds: 'Nuts & Seeds',
      spices: 'Spices & Herbs',
      condiments: 'Condiments & Oils',
      canned: 'Canned Goods',
      other: 'Other',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* My Pantry Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900" data-testid="my-pantry-title">
            Ingredient Inventory ({pantryItems.length} items)
          </h2>
          {pantryItems.length > 0 && (
            <button
              onClick={clearPantry}
              data-testid="clear-pantry-btn"
              className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {pantryItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500" data-testid="empty-pantry-message">
            <p className="text-lg font-medium">No ingredients in inventory</p>
            <p className="text-sm mt-2">Add ingredients below to begin generating recipes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="pantry-items-grid">
            {pantryItems.map((item) => (
              <div
                key={item.id}
                data-testid={`pantry-item-${item.ingredient_name}`}
                className="ingredient-tag relative bg-green-100 border-2 border-green-300 rounded-lg p-3 text-center group"
              >
                <button
                  onClick={() => removeFromPantry(item.id)}
                  data-testid={`remove-${item.ingredient_name}-btn`}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ×
                </button>
                <div className="text-sm font-medium text-gray-800 capitalize">
                  {item.ingredient_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Ingredients Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900" data-testid="add-ingredients-title">
            Add Ingredients
          </h2>
          <button
            onClick={() => setShowAddCustom(!showAddCustom)}
            data-testid="toggle-custom-ingredient-btn"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {showAddCustom ? 'Show All Ingredients' : '+ Add Custom Ingredient'}
          </button>
        </div>

        {/* Custom Ingredient Form */}
        {showAddCustom && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="custom-ingredient-form">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Add Custom Ingredient</h3>
            <p className="text-sm text-gray-600 mb-4">
              Can't find an ingredient? Add it here and it will be available to all users forever!
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Name</label>
                <input
                  type="text"
                  value={customIngredientName}
                  onChange={(e) => setCustomIngredientName(e.target.value)}
                  placeholder="e.g., Dragon Fruit, Kimchi, etc."
                  data-testid="custom-ingredient-name-input"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={customIngredientCategory}
                  onChange={(e) => setCustomIngredientCategory(e.target.value)}
                  data-testid="custom-ingredient-category-select"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="grains">Grains</option>
                  <option value="proteins">Proteins</option>
                  <option value="dairy">Dairy</option>
                  <option value="nuts_seeds">Nuts & Seeds</option>
                  <option value="spices">Spices & Herbs</option>
                  <option value="condiments">Condiments & Oils</option>
                  <option value="canned">Canned Goods</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                onClick={addCustomIngredient}
                disabled={addingCustom || !customIngredientName.trim()}
                data-testid="add-custom-ingredient-btn"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingCustom ? 'Adding...' : 'Add to Global Database & My Pantry'}
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        {!showAddCustom && (
          <>
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-ingredients-input"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  data-testid="category-all-btn"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    data-testid={`category-${category}-btn`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryLabel(category)}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Ingredients */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="available-ingredients-grid">
              {filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient.id}
                  onClick={() => addToPantry(ingredient.name)}
                  disabled={loading}
                  data-testid={`add-ingredient-${ingredient.name}-btn`}
                  className="ingredient-tag bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-center hover:bg-green-50 hover:border-green-400 transition-all disabled:opacity-50"
                >
                  <div className="text-sm font-medium text-gray-800 capitalize">
                    {ingredient.name}
                  </div>
                </button>
              ))}
            </div>

            {filteredIngredients.length === 0 && (
              <div className="text-center py-8 text-gray-500" data-testid="no-ingredients-message">
                No ingredients found. Try adjusting your search or filters, or add a custom ingredient!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyPantry;
