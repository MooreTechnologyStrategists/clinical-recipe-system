import React from 'react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative">
      {/* Skip Button - Top Right */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onGetStarted}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Skip to App →
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Your Personal Clinical Nutritionist 🏥
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-4xl mx-auto">
            Evidence-based recipe recommendations tailored to your unique health conditions
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
            Finally, a nutrition system that understands hypertension, diabetes, kidney disease, and more—delivering medically-sound recipes you can trust.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={onGetStarted}
              data-testid="get-started-btn"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Get Started Free
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-green-600">FREE</span> introductory access, then only $0.99/month
            </div>
          </div>
        </div>

        {/* Problem Statement */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-16 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            What's Been Missing in Recipe Apps
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-red-600 mb-4">Traditional Recipe Apps:</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <p className="text-gray-700">No consideration for medical conditions</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <p className="text-gray-700">Vague nutritional information</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <p className="text-gray-700">No sodium warnings for hypertension</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <p className="text-gray-700">Missing sugar guidance for diabetes</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">✗</span>
                  <p className="text-gray-700">Generic advice that doesn't fit YOUR needs</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-green-600 mb-4">Our Clinical System:</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-green-600 mr-3 mt-1">✓</span>
                  <p className="text-gray-700">Optimized for 13+ health conditions</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-3 mt-1">✓</span>
                  <p className="text-gray-700">Comprehensive 10-nutrient analysis per serving</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-3 mt-1">✓</span>
                  <p className="text-gray-700">Condition-specific health warnings</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-3 mt-1">✓</span>
                  <p className="text-gray-700">Therapeutic benefits of herbs & spices</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-3 mt-1">✓</span>
                  <p className="text-gray-700">Personalized to YOUR health profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Clinical-Grade Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-blue-600 text-4xl mb-4">🏥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Comprehensive Health Profiles
              </h3>
              <p className="text-gray-600">
                Track hypertension, diabetes, kidney disease, heart conditions, cancer history, and 8+ other conditions with detailed medical considerations.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-blue-600 text-4xl mb-4">⚕️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Evidence-Based Warnings
              </h3>
              <p className="text-gray-600">
                Receive specific guidance on sodium for hypertension, sugar for diabetes, protein for kidney disease—all backed by clinical research.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-blue-600 text-4xl mb-4">🌿</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Therapeutic Ingredients
              </h3>
              <p className="text-gray-600">
                Learn the medicinal properties of herbs and spices—turmeric's anti-inflammatory effects, garlic's cardiovascular benefits, and more.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-blue-600 text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Complete Nutritional Analysis
              </h3>
              <p className="text-gray-600">
                Every recipe includes 10 key nutrients: calories, protein, carbs, fat, fiber, sodium, sugar, saturated fat, cholesterol, and potassium.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-blue-600 text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Suitability Assessments
              </h3>
              <p className="text-gray-600">
                Each recipe is evaluated for suitability across major health conditions with detailed explanations and modifications.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-blue-600 text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI-Powered Personalization
              </h3>
              <p className="text-gray-600">
                Advanced AI acts as your clinical nutritionist, generating recipes optimized for your specific health conditions and dietary needs.
              </p>
            </div>
          </div>
        </div>

        {/* Health Conditions Coverage */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-8 md:p-12 mb-16 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Optimized for Your Health Conditions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Hypertension (High Blood Pressure)',
              'Diabetes (Type 1 & Type 2)',
              'Chronic Kidney Disease',
              'Heart Disease',
              'High Cholesterol',
              'Pre-Diabetes',
              'Liver Disease',
              'Cancer Prevention & Management',
              'Digestive Disorders (IBS, Crohn\'s)',
              'Autoimmune Conditions',
              'Thyroid Disorders',
              'Osteoporosis',
              'Gout'
            ].map((condition, idx) => (
              <div key={idx} className="flex items-center bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur">
                <span className="text-green-300 mr-2">✓</span>
                <span className="text-sm">{condition}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create Health Profile
              </h3>
              <p className="text-gray-600 text-sm">
                Enter your health conditions, allergies, activity level, and wellness goals
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Add Your Ingredients
              </h3>
              <p className="text-gray-600 text-sm">
                Select from 123+ ingredients or add what you have in your kitchen
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generate Recipe
              </h3>
              <p className="text-gray-600 text-sm">
                AI creates condition-optimized recipes with complete health analysis
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cook with Confidence
              </h3>
              <p className="text-gray-600 text-sm">
                Follow recipes knowing they're safe and beneficial for your health
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 mb-16 border-2 border-blue-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Affordable Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Professional nutrition guidance shouldn't cost hundreds of dollars
            </p>
          </div>
          
          <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-2 border-blue-300">
            <div className="text-center mb-6">
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
                Introductory Offer
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                FREE
              </div>
              <div className="text-gray-600 mb-4">
                Full access during launch period
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                $0.99<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <div className="text-sm text-gray-600">
                After free trial period
              </div>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-sm text-gray-700">Unlimited recipe generation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-sm text-gray-700">Complete health profile tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-sm text-gray-700">Full nutritional analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-sm text-gray-700">Condition-specific guidance</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-sm text-gray-700">Save unlimited recipes</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-sm text-gray-700">Regular AI model updates</span>
              </li>
            </ul>

            <button
              onClick={onGetStarted}
              data-testid="pricing-get-started-btn"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Start Free Today
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Compare to: Clinical nutritionist consultations ($100-300/session) or meal planning services ($50-150/month)
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Health Through Nutrition?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands taking control of their health with evidence-based nutrition
          </p>
          <button
            onClick={onGetStarted}
            data-testid="final-cta-btn"
            className="px-12 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Get Started Free
          </button>
          <p className="text-sm text-blue-100 mt-4">
            No credit card required • Start in 2 minutes
          </p>
        </div>

        {/* Integration Info for AskDoGood */}
        <div className="mt-16 bg-gray-50 rounded-xl p-8 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Seamless Integration with AskDoGood.com
          </h3>
          <p className="text-gray-700 mb-4">
            This Clinical Nutritional Recipe System is designed to integrate seamlessly with your existing AskDoGood health profile, creating a complete wellness ecosystem.
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Your health conditions automatically sync across platforms</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Recipe recommendations align with your overall health goals</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Track nutrition alongside other health metrics in one place</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
