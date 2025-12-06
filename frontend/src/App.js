import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast, Toaster } from 'sonner';
import { ChefHat, Pill, BookOpen, LogOut, User, Plus, Trash2, Loader2, Heart, Clock, Users } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900">Clinical Recipe System</span>
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link to="/" data-testid="nav-home-link">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link to="/recipes" data-testid="nav-recipes-link">
                <Button variant="ghost">Generate Recipe</Button>
              </Link>
              <Link to="/medications" data-testid="nav-medications-link">
                <Button variant="ghost">Medications</Button>
              </Link>
              <Link to="/my-recipes" data-testid="nav-my-recipes-link">
                <Button variant="ghost">My Recipes</Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-700">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="logout-button">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Auth Page
const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload);
      login(response.data.access_token, response.data.user);
      toast.success(isLogin ? 'Logged in successfully!' : 'Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <ChefHat className="h-12 w-12 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl text-center">Clinical Recipe System</CardTitle>
          <CardDescription className="text-center">
            {isLogin ? 'Welcome back! Please login.' : 'Create your account to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  data-testid="signup-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="auth-email-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="auth-password-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="auth-submit-button">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isLogin ? (
                'Login'
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-emerald-600 hover:underline"
              data-testid="auth-toggle-button"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Home Page
const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navigation />
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="relative h-[600px] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1604298331663-de303fbc7059?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNtb290aGllfGVufDB8fHx8MTc2NDk5NzU2Mnww&ixlib=rb-4.1.0&q=85"
            alt="Fresh Smoothie"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-20 text-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-4" data-testid="hero-title">
              Welcome to Clinical Recipe System
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              AI-powered personalized recipes designed for your health and medication needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/recipes')}
                className="bg-white text-emerald-600 hover:bg-gray-100"
                data-testid="hero-generate-recipe-button"
              >
                Generate Recipe
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/medications')}
                className="bg-transparent border-white text-white hover:bg-white/10"
                data-testid="hero-manage-medications-button"
              >
                Manage Medications
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Dish Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/recipes')}>
              <CardContent className="p-6">
                <img
                  src="https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg"
                  alt="Hot Dishes"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Hot Dishes</h3>
                <p className="text-gray-600">Warm, comforting meals perfect for any time</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/recipes')}>
              <CardContent className="p-6">
                <img
                  src="https://images.unsplash.com/photo-1719196339826-c66c13ad5b86"
                  alt="Cold Dishes"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Cold Dishes</h3>
                <p className="text-gray-600">Fresh salads and cold preparations</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/recipes')}>
              <CardContent className="p-6">
                <img
                  src="https://images.unsplash.com/photo-1557568951-a691f75c810f"
                  alt="Smoothies"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Smoothies</h3>
                <p className="text-gray-600">Nutritious blended beverages</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/recipes')}>
              <CardContent className="p-6">
                <img
                  src="https://images.unsplash.com/photo-1497534446932-c925b458314e"
                  alt="Juicing"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Juicing</h3>
                <p className="text-gray-600">Fresh pressed juices for vitality</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recipe Generator Page
const RecipeGeneratorPage = () => {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [formData, setFormData] = useState({
    dish_type: '',
    diet_type: '',
    preferences: ''
  });

  const dishTypes = ['hot', 'cold', 'smoothie', 'juicing'];
  const dietTypes = ['keto', 'paleo', 'vegan', 'vegetarian', 'mediterranean', 'atkins', 'gluten-free', 'dairy-free', 'low-carb', 'whole30'];

  const handleGenerate = async () => {
    if (!formData.dish_type) {
      toast.error('Please select a dish type');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/recipes/generate`, formData);
      setRecipe(response.data);
      toast.success('Recipe generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8" data-testid="recipe-generator-title">
          Generate Your Perfect Recipe
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Recipe Preferences</CardTitle>
              <CardDescription>Tell us what you'd like to create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dish Type *</Label>
                <Select value={formData.dish_type} onValueChange={(value) => setFormData({ ...formData, dish_type: value })}>
                  <SelectTrigger data-testid="dish-type-select">
                    <SelectValue placeholder="Select dish type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dishTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Diet Type (Optional)</Label>
                <Select value={formData.diet_type} onValueChange={(value) => setFormData({ ...formData, diet_type: value })}>
                  <SelectTrigger data-testid="diet-type-select">
                    <SelectValue placeholder="Select diet type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dietTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Additional Preferences</Label>
                <Textarea
                  data-testid="preferences-textarea"
                  placeholder="e.g., I prefer low sodium, avoid nuts, etc."
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  rows={4}
                />
              </div>

              <Button onClick={handleGenerate} className="w-full" disabled={loading} data-testid="generate-recipe-button">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Recipe'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recipe Display */}
          {recipe && (
            <Card>
              <CardHeader>
                <img src={recipe.image_url} alt={recipe.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                <CardTitle className="text-2xl" data-testid="recipe-name">{recipe.name}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge>{recipe.dish_type}</Badge>
                  {recipe.diet_type && <Badge variant="outline">{recipe.diet_type}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 text-sm text-gray-600">
                  {recipe.prep_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Prep: {recipe.prep_time}
                    </div>
                  )}
                  {recipe.cook_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Cook: {recipe.cook_time}
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Serves: {recipe.servings}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <ol className="list-decimal pl-5 space-y-2">
                    {recipe.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>

                {recipe.health_notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Health Notes</h3>
                      <p className="text-sm text-gray-600">{recipe.health_notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Medication Manager Page
const MedicationManagerPage = () => {
  const [medications, setMedications] = useState([]);
  const [userMedications, setUserMedications] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [medsRes, userMedsRes, recsRes] = await Promise.all([
        axios.get(`${API}/medications/list`),
        axios.get(`${API}/user-medications/list`),
        axios.get(`${API}/recommendations/foods-for-meds`)
      ]);
      setMedications(medsRes.data);
      setUserMedications(userMedsRes.data);
      setRecommendations(recsRes.data);
    } catch (error) {
      toast.error('Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (medicationId) => {
    try {
      await axios.post(`${API}/user-medications/add?medication_id=${medicationId}`);
      toast.success('Medication added!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add medication');
    }
  };

  const handleRemoveMedication = async (medicationId) => {
    try {
      await axios.delete(`${API}/user-medications/${medicationId}`);
      toast.success('Medication removed!');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove medication');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <Navigation />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  const userMedicationIds = userMedications.map((um) => um.medication_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8" data-testid="medication-manager-title">
          Medication Manager
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Medications */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Current Medications</CardTitle>
                <CardDescription>Medications you're currently taking</CardDescription>
              </CardHeader>
              <CardContent>
                {userMedications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No medications added yet</p>
                ) : (
                  <div className="space-y-2">
                    {userMedications.map((userMed) => (
                      <div key={userMed.medication_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Pill className="h-5 w-5 text-emerald-600" />
                          <span className="font-medium">{userMed.medication_name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedication(userMed.medication_id)}
                          data-testid={`remove-medication-${userMed.medication_id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations && userMedications.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Food & Vitamin Recommendations</CardTitle>
                  <CardDescription>Based on your medications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-green-600 mb-2">Recommended Foods</h3>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.recommended_foods.map((food, idx) => (
                        <Badge key={idx} variant="outline" className="bg-green-50">
                          {food}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-red-600 mb-2">Foods to Avoid</h3>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.foods_to_avoid.map((food, idx) => (
                        <Badge key={idx} variant="outline" className="bg-red-50">
                          {food}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-blue-600 mb-2">Vitamin Recommendations</h3>
                    <ul className="space-y-1 text-sm">
                      {recommendations.vitamin_recommendations.map((rec, idx) => (
                        <li key={idx} className="text-gray-700">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <p className="text-sm text-gray-600">{recommendations.general_advice}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Available Medications */}
          <Card>
            <CardHeader>
              <CardTitle>Available Medications</CardTitle>
              <CardDescription>Click to add to your list</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {medications.map((med) => {
                  const isAdded = userMedicationIds.includes(med.id);
                  return (
                    <div
                      key={med.id}
                      className={`p-4 rounded-lg border ${isAdded ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{med.name}</h3>
                          <Badge variant="outline" className="mt-1">
                            {med.category}
                          </Badge>
                          {med.avoid_foods && med.avoid_foods.length > 0 && (
                            <p className="text-xs text-gray-600 mt-2">
                              <strong>Avoid:</strong> {med.avoid_foods.join(', ')}
                            </p>
                          )}
                        </div>
                        {!isAdded && (
                          <Button
                            size="sm"
                            onClick={() => handleAddMedication(med.id)}
                            data-testid={`add-medication-${med.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// My Recipes Page
const MyRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get(`${API}/recipes/list`);
      setRecipes(response.data);
    } catch (error) {
      toast.error('Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recipeId) => {
    try {
      await axios.delete(`${API}/recipes/${recipeId}`);
      toast.success('Recipe deleted!');
      fetchRecipes();
    } catch (error) {
      toast.error('Failed to delete recipe');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <Navigation />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8" data-testid="my-recipes-title">
          My Saved Recipes
        </h1>

        {recipes.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No recipes saved yet</p>
              <Button onClick={() => window.location.href = '/recipes'}>Generate Your First Recipe</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <img src={recipe.image_url} alt={recipe.name} className="w-full h-48 object-cover rounded-t-lg" />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{recipe.name}</h3>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <Badge>{recipe.dish_type}</Badge>
                      {recipe.diet_type && <Badge variant="outline">{recipe.diet_type}</Badge>}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mb-4">
                      {recipe.servings && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {recipe.servings}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDelete(recipe.id)}
                      data-testid={`delete-recipe-${recipe.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return token ? children : <Navigate to="/auth" />;
};

// Main App
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <RecipeGeneratorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medications"
            element={
              <ProtectedRoute>
                <MedicationManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-recipes"
            element={
              <ProtectedRoute>
                <MyRecipesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
