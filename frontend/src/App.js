import React, { useState, useEffect } from 'react';
import '@/App.css';
import axios from 'axios';
import MyPantry from '@/components/MyPantry';
import GenerateRecipe from '@/components/GenerateRecipe';
import RecipeList from '@/components/RecipeList';
import RecipeDetail from '@/components/RecipeDetail';
import HealthProfile from '@/components/HealthProfile';
import LandingPage from '@/components/LandingPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('health-profile');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [pantryItems, setPantryItems] = useState([]);
  const [healthProfile, setHealthProfile] = useState(null);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisitedClinicalRecipes');
    if (hasVisited) {
      setShowLanding(false);
    }

    // Listen for navigation events from child components
    const handleNavigateToGenerate = () => {
      setActiveTab('generate');
    };

    window.addEventListener('navigateToGenerate', handleNavigateToGenerate);
    
    return () => {
      window.removeEventListener('navigateToGenerate', handleNavigateToGenerate);
    };
  }, []);

  const handleViewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setActiveTab('recipe-detail');
  };

  const handleBackToList = () => {
    setSelectedRecipe(null);
    setActiveTab('recipes');
  };

  const handleGetStarted = () => {
    localStorage.setItem('hasVisitedClinicalRecipes', 'true');
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900" data-testid="app-title">
                Clinical Nutritional Recipe System
              </h1>
              <p className="text-sm text-gray-600 mt-1">Evidence-based recipe recommendations with comprehensive health analysis</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('health-profile')}
              data-testid="nav-health-profile"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'health-profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Health Profile
            </button>
            <button
              onClick={() => setActiveTab('pantry')}
              data-testid="nav-pantry"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pantry'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ingredient Inventory
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              data-testid="nav-generate"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'generate'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generate Recipe
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              data-testid="nav-recipes"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'recipes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saved Recipes
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'health-profile' && (
          <HealthProfile
            apiUrl={API}
            healthProfile={healthProfile}
            setHealthProfile={setHealthProfile}
          />
        )}
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
            healthProfile={healthProfile}
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
