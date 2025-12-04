import React, { useState } from 'react';
import '@/App.css';
import axios from 'axios';
import MyPantry from '@/components/MyPantry';
import GenerateRecipe from '@/components/GenerateRecipe';
import RecipeList from '@/components/RecipeList';
import RecipeDetail from '@/components/RecipeDetail';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [activeTab, setActiveTab] = useState('pantry');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [pantryItems, setPantryItems] = useState([]);

  const handleViewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setActiveTab('recipe-detail');
  };

  const handleBackToList = () => {
    setSelectedRecipe(null);
    setActiveTab('recipes');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">🍳</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900" data-testid="app-title">
                  Smart Recipe Generator
                </h1>
                <p className="text-sm text-gray-600 mt-1">Turn your ingredients into delicious meals</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pantry')}
              data-testid="nav-pantry"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pantry'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🥬 My Pantry
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              data-testid="nav-generate"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'generate'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ✨ Generate Recipe
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              data-testid="nav-recipes"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'recipes'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📖 Saved Recipes
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pantry' && (
          <MyPantry
            apiUrl={API}
            pantryItems={pantryItems}
            setPantryItems={setPantryItems}
          />
        )}
        {activeTab === 'generate' && (
          <GenerateRecipe
            apiUrl={API}
            pantryItems={pantryItems}
            onRecipeGenerated={handleViewRecipe}
          />
        )}
        {activeTab === 'recipes' && (
          <RecipeList
            apiUrl={API}
            onViewRecipe={handleViewRecipe}
          />
        )}
        {activeTab === 'recipe-detail' && selectedRecipe && (
          <RecipeDetail
            apiUrl={API}
            recipe={selectedRecipe}
            onBack={handleBackToList}
          />
        )}
      </main>
    </div>
  );
}

export default App;
