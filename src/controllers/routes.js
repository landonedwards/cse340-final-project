import { Router } from 'express';
import { showRegistrationForm, showEditAccountForm, processRegistration, processEditAccount, processDeleteAccount } from './forms/registration.js';
import { showLoginForm, processLogin, processLogout } from './forms/login.js';
import { showRecipeForm, handleRecipeSubmission, recipeListPage, recipeDetailPage } from './recipes/recipe.js';
import { recipeValidation, registrationValidation, loginValidation, editValidation } from '../middleware/validation/forms.js';

import { requireLogin, requireRole } from '../middleware/auth.js';

// create a new router instance
const router = Router();

// --- registration routes --- 

// GET /register - Display the registration form
router.get('/register', showRegistrationForm);

// POST /register - Handle registration form submission with validation
router.post('/register', registrationValidation, processRegistration);

// -- account management routes -- 

// GET /register/list - Display all registered users
// FIX THIS: may want to change hardcoded role name
router.get('/register/list', requireRole('admin'), showAllUsers);

// GET /register/:id/edit - Display edit account form
router.get('/register/:id/edit', requireLogin, showEditAccountForm);

// POST /register/:id/edit - Process account edit
router.post('/register/:id/edit', requireLogin, editValidation, processEditAccount);

// POST /register/:id/delete - Delete user account
router.post('/register/:id/delete', requireLogin, processDeleteAccount);

// -- login routes (form and submission) --

// GET /login - Display login form
router.get('/login', showLoginForm);

// POST /login - Handle login form submission with validation
router.post('/login', loginValidation, processLogin);

// GET /logout - Handle logout 
router.get('/logout', processLogout);

// --- recipe routes --- 

// GET /recipes - Display the general recipe catalog page
router.get('/recipes', recipeListPage);

// GET /recipes/upload - Display recipe upload form
router.get('/recipes/upload', requireLogin, showRecipeForm);

// POST /recipes/upload - Handles recipes form submission with validation
router.post('/recipes/upload', requireLogin, recipeValidation, handleRecipeSubmission);

// GET /recipes/:recipeId - Display recipe detail page 
router.get('/recipes/:recipeId', recipeDetailPage);

export default router;