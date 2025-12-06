import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Medications = ({ apiUrl }) => {
  const [medications, setMedications] = useState([]);
  const [userMedications, setUserMedications] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customMedName, setCustomMedName] = useState('');
  const [customMedCategory, setCustomMedCategory] = useState('other');
  const [showAddCustom, setShowAddCustom] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [medsRes, userMedsRes, recsRes] = await Promise.all([
        axios.get(`${apiUrl}/medications/list`),
        axios.get(`${apiUrl}/user-medications/list`),
        axios.get(`${apiUrl}/recommendations/foods-for-meds`)
      ]);
      setMedications(medsRes.data);
      setUserMedications(userMedsRes.data);
      setRecommendations(recsRes.data);
      setError('');
    } catch (error) {
      console.error('Error fetching medications:', error);
      setError('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (medicationId) => {
    try {
      await axios.post(`${apiUrl}/user-medications/add?medication_id=${medicationId}`);
      fetchData();
    } catch (error) {
      console.error('Error adding medication:', error);
      alert(error.response?.data?.detail || 'Failed to add medication');
    }
  };

  const handleRemoveMedication = async (medicationId) => {
    if (!window.confirm('Remove this medication?')) return;
    
    try {
      await axios.delete(`${apiUrl}/user-medications/${medicationId}`);
      fetchData();
    } catch (error) {
      console.error('Error removing medication:', error);
      alert('Failed to remove medication');
    }
  };

  const handleAddCustomMedication = async (e) => {
    e.preventDefault();
    if (!customMedName.trim()) {
      alert('Please enter a medication name');
      return;
    }

    try {
      await axios.post(`${apiUrl}/medications/add-custom`, {
        name: customMedName,
        category: customMedCategory
      });
      setCustomMedName('');
      setCustomMedCategory('other');
      setShowAddCustom(false);
      fetchData();
      alert('Custom medication added successfully!');
    } catch (error) {
      console.error('Error adding custom medication:', error);
      alert(error.response?.data?.detail || 'Failed to add custom medication');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userMedicationIds = userMedications.map((um) => um.medication_id);

  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Current Medications */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4" data-testid="current-medications-title">
          Your Current Medications
        </h2>
        <p className="text-gray-600 mb-6">
          Track your medications to get personalized food recommendations
        </p>

        {userMedications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No medications added yet</p>
            <p className="text-sm">Add medications from the list below to get food recommendations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userMedications.map((userMed) => (
              <div
                key={userMed.medication_id}
                className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                data-testid={`current-med-${userMed.medication_id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    💊
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{userMed.medication_name}</p>
                    <p className="text-sm text-gray-600">
                      Added {new Date(userMed.added_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMedication(userMed.medication_id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  data-testid={`remove-med-${userMed.medication_id}-btn`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food & Vitamin Recommendations */}
      {recommendations && userMedications.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Food & Vitamin Recommendations
          </h2>
          <p className="text-gray-600 mb-6">{recommendations.general_advice}</p>

          <div className="space-y-6">
            {/* Recommended Foods */}
            {recommendations.recommended_foods.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                  <span className="mr-2">✅</span> Recommended Foods
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {recommendations.recommended_foods.map((food, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"
                    >
                      {food}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Foods to Avoid */}
            {recommendations.foods_to_avoid.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                  <span className="mr-2">⚠️</span> Foods to Avoid
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {recommendations.foods_to_avoid.map((food, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
                    >
                      {food}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vitamin Recommendations */}
            {recommendations.vitamin_recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
                  <span className="mr-2">💊</span> Vitamin & Supplement Notes
                </h3>
                <ul className="space-y-2">
                  {recommendations.vitamin_recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900"
                    >
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available Medications */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900" data-testid="available-medications-title">
            Available Medications
          </h2>
          <button
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            data-testid="toggle-custom-med-btn"
          >
            {showAddCustom ? 'Cancel' : '+ Add Custom'}
          </button>
        </div>

        {showAddCustom && (
          <form onSubmit={handleAddCustomMedication} className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Add Custom Medication</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={customMedName}
                  onChange={(e) => setCustomMedName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter medication name"
                  data-testid="custom-med-name-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={customMedCategory}
                  onChange={(e) => setCustomMedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  data-testid="custom-med-category-select"
                >
                  <option value="other">Other</option>
                  <option value="diabetes">Diabetes</option>
                  <option value="hypertension">Hypertension</option>
                  <option value="cholesterol">Cholesterol</option>
                  <option value="thyroid">Thyroid</option>
                  <option value="acid_reflux">Acid Reflux</option>
                  <option value="blood_thinner">Blood Thinner</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              data-testid="submit-custom-med-btn"
            >
              Add Medication
            </button>
          </form>
        )}

        <p className="text-gray-600 mb-4">
          Click to add medications to your profile
        </p>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {medications.map((med) => {
            const isAdded = userMedicationIds.includes(med.id);
            return (
              <div
                key={med.id}
                className={`p-4 rounded-lg border ${
                  isAdded
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-gray-100'
                } transition-all`}
                data-testid={`med-item-${med.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{med.name}</h3>
                      {med.is_custom && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Custom
                        </span>
                      )}
                      {isAdded && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          ✓ Added
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      <span className="font-medium">Category:</span> {med.category}
                    </p>
                    {med.avoid_foods && med.avoid_foods.length > 0 && (
                      <p className="text-xs text-red-600 mb-1">
                        <span className="font-medium">Avoid:</span> {med.avoid_foods.slice(0, 3).join(', ')}
                        {med.avoid_foods.length > 3 && '...'}
                      </p>
                    )}
                    {med.recommended_foods && med.recommended_foods.length > 0 && (
                      <p className="text-xs text-green-600">
                        <span className="font-medium">Recommended:</span> {med.recommended_foods.slice(0, 3).join(', ')}
                        {med.recommended_foods.length > 3 && '...'}
                      </p>
                    )}
                  </div>
                  {!isAdded && (
                    <button
                      onClick={() => handleAddMedication(med.id)}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      data-testid={`add-med-${med.id}-btn`}
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Medications;
