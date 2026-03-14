import { Router } from 'express';
import { showRegistrationForm } from './forms/registration.js';
import { showLoginForm } from './forms/login.js';
import { showRecipeForm, handleRecipeSubmission, recipeListPage, recipeDetailPage } from './recipes/recipe.js';
import { recipeValidation } from '../middleware/validation/forms.js';

// create a new router instance
const router = Router();

// --- authentication routes --- 

// GET /register - Display the registration form
router.get('/register', showRegistrationForm);
// login routes (form and submission)
router.get('/login', showLoginForm);

// --- recipe routes --- 

// the general recipe catalog page
router.get('/recipes', recipeListPage);

// NEED TO CHANGE THIS LATER (SHOULD ONLY BE ENABLED FOR LOGGED IN USERS)
router.get('/recipes/upload', showRecipeForm);

// handles recipes form submission with validation
router.post('/recipes/upload', recipeValidation, handleRecipeSubmission);

// dynamic detail page 
router.get('/recipes/:recipeId', recipeDetailPage);

export default router;