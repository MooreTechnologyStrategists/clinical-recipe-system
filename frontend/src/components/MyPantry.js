import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { INGREDIENTS_DATABASE, CATEGORIES } from '../data/ingredients';

const MyPantry = ({ apiUrl, pantryItems, setPantryItems }) => {
  const [allIngredients, setAllIngredients] = useState(INGREDIENTS_DATABASE); // Use static data as default
  const [categories, setCategories] = useState(CATEGORIES); // Use static categories
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customIngredientName, setCustomIngredientName] = useState('');
  const [customIngredientCategory, setCustomIngredientCategory] = useState('other');
  const [addingCustom, setAddingCustom] = useState(false);

  useEffect(() => {
    // Try to fetch from API, but fallback to static data
    fetchAllIngredients();
    fetchPantryItems();
  }, []);

  const fetchAllIngredients = async () => {
    try {
      const response = await axios.get(`${apiUrl}/ingredients`);
      setAllIngredients(response.data); // Use API data if available
    } catch (error) {
      console.log('Using static ingredient database (API unavailable)');
      // Keep using INGREDIENTS_DATABASE from initial state
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/ingredients/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.log('Using static categories (API unavailable)');
      // Keep using CATEGORIES from initial state
    }
  };

  // Rest of your component code stays the same...