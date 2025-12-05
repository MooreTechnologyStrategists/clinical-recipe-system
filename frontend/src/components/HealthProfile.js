import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HealthProfile = ({ apiUrl, healthProfile, setHealthProfile }) => {
  const [conditions, setConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [ageRange, setAgeRange] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [healthGoals, setHealthGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchHealthProfile();
  }, []);

  const fetchHealthProfile = async () => {
    try {
      const response = await axios.get(`${apiUrl}/health-profile`);
      const profile = response.data;
      
      setConditions(profile.conditions || []);
      setAllergies(profile.allergies || []);
      setDietaryRestrictions(profile.dietary_restrictions || []);
      setAgeRange(profile.age_range || '');
      setActivityLevel(profile.activity_level || '');
      setHealthGoals(profile.health_goals || []);
      setHealthProfile(profile);
    } catch (error) {
      console.error('Error fetching health profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiUrl}/health-profile`, {
        conditions,
        allergies,
        dietary_restrictions: dietaryRestrictions,
        age_range: ageRange,
        activity_level: activityLevel,
        health_goals: healthGoals,
      });
      
      // Update local state to match saved profile
      const savedProfile = response.data;
      setConditions(savedProfile.conditions || []);
      setAllergies(savedProfile.allergies || []);
      setDietaryRestrictions(savedProfile.dietary_restrictions || []);
      setAgeRange(savedProfile.age_range || '');
      setActivityLevel(savedProfile.activity_level || '');
      setHealthGoals(savedProfile.health_goals || []);
      
      setHealthProfile(savedProfile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving health profile:', error);
      alert('Failed to save health profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array, setArray, item) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const healthConditions = [
    { value: 'hypertension', label: 'Hypertension (High Blood Pressure)' },
    { value: 'diabetes', label: 'Diabetes (Type 1 or Type 2)' },
    { value: 'pre_diabetes', label: 'Pre-Diabetes' },
    { value: 'kidney_disease', label: 'Chronic Kidney Disease' },
    { value: 'heart_disease', label: 'Heart Disease / Cardiovascular Disease' },
    { value: 'high_cholesterol', label: 'High Cholesterol' },
    { value: 'liver_disease', label: 'Liver Disease' },
    { value: 'cancer_history', label: 'Cancer (History or Active)' },
    { value: 'digestive_disorders', label: 'Digestive Disorders (IBS, Crohn\'s, etc.)' },
    { value: 'autoimmune', label: 'Autoimmune Conditions' },
    { value: 'thyroid_disorders', label: 'Thyroid Disorders' },
    { value: 'osteoporosis', label: 'Osteoporosis' },
    { value: 'gout', label: 'Gout' },
  ];

  const commonAllergies = [
    'Peanuts', 'Tree nuts', 'Shellfish', 'Fish', 'Eggs', 'Milk', 'Soy', 'Wheat', 'Gluten',
  ];

  const ageRanges = [
    '18-30', '31-40', '41-50', '51-60', '61-70', '70+',
  ];

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'light', label: 'Lightly active (exercise 1-3 days/week)' },
    { value: 'moderate', label: 'Moderately active (exercise 3-5 days/week)' },
    { value: 'very_active', label: 'Very active (exercise 6-7 days/week)' },
    { value: 'extra_active', label: 'Extra active (physical job + exercise)' },
  ];

  const healthGoalOptions = [
    'Weight loss',
    'Weight gain',
    'Muscle building',
    'Heart health',
    'Blood sugar control',
    'Blood pressure management',
    'Reduce inflammation',
    'Improve digestion',
    'Boost immunity',
    'Cancer prevention',
    'Bone health',
    'Mental clarity',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900" data-testid="health-profile-title">
              Health Profile
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure your health information for personalized recipe recommendations
            </p>
          </div>
          {saved && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
              Profile Saved Successfully
            </div>
          )}
        </div>

        {/* Medical Conditions */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Conditions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select any health conditions you have. This will help generate recipes optimized for your specific needs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="health-conditions-grid">
            {healthConditions.map((condition) => (
              <button
                key={condition.value}
                onClick={() => toggleArrayItem(conditions, setConditions, condition.value)}
                data-testid={`condition-${condition.value}-btn`}
                className={`p-4 rounded-lg text-left text-sm font-medium transition-all border-2 ${
                  conditions.includes(condition.value)
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{condition.label}</span>
                  {conditions.includes(condition.value) && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Food Allergies</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select any food allergies to exclude these ingredients from recipes.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-testid="allergies-grid">
            {commonAllergies.map((allergy) => (
              <button
                key={allergy}
                onClick={() => toggleArrayItem(allergies, setAllergies, allergy)}
                data-testid={`allergy-${allergy}-btn`}
                className={`p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                  allergies.includes(allergy)
                    ? 'bg-red-50 border-red-500 text-red-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Age Range</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3" data-testid="age-range-grid">
            {ageRanges.map((range) => (
              <button
                key={range}
                onClick={() => setAgeRange(range)}
                data-testid={`age-${range}-btn`}
                className={`p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                  ageRange === range
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Level */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Physical Activity Level</h3>
          <div className="space-y-2" data-testid="activity-level-grid">
            {activityLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setActivityLevel(level.value)}
                data-testid={`activity-${level.value}-btn`}
                className={`w-full p-4 rounded-lg text-left text-sm font-medium transition-all border-2 ${
                  activityLevel === level.value
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Health Goals */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Health & Wellness Goals</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-testid="health-goals-grid">
            {healthGoalOptions.map((goal) => (
              <button
                key={goal}
                onClick={() => toggleArrayItem(healthGoals, setHealthGoals, goal)}
                data-testid={`goal-${goal}-btn`}
                className={`p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                  healthGoals.includes(goal)
                    ? 'bg-green-50 border-green-500 text-green-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={saveProfile}
            disabled={loading}
            data-testid="save-health-profile-btn"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Health Profile'}
          </button>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">How Your Health Profile is Used</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Recipes are tailored to manage your specific health conditions with appropriate nutrient levels</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Ingredients that may be harmful for your conditions are flagged with detailed warnings</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Nutritional benefits of herbs, spices, and key ingredients are highlighted for your conditions</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Sodium, sugar, and other nutrients are monitored with condition-specific guidance</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Each recipe includes a suitability assessment for your health profile</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HealthProfile;
