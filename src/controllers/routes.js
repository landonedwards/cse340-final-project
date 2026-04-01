import { Router } from 'express';
import { homePage } from './index.js';
import { showRegistrationForm, showEditAccountForm, showAllUsers, processRegistration, processEditAccount, processDeleteAccount } from './forms/registration.js';
import { showLoginForm, processLogin, processLogout } from './forms/login.js';
import { showRecipeForm, handleRecipeSubmission, recipeListPage, recipeDetailPage, recipeManagePage, showEditRecipeForm, handleRecipeEdit } from './recipes/recipe.js';
import { recipeValidation, registrationValidation, loginValidation, editValidation } from '../middleware/validation/forms.js';

import { requireLogin, requireRole } from '../middleware/auth.js';

// create a new router instance
const router = Router();

// -- static pages --

// GET / - Display the home page
router.get('/', homePage);

// --- registration routes --- 

// GET /register - Display the registration form
router.get('/register', showRegistrationForm);

// POST /register - Handle registration form submission with validation
router.post('/register', registrationValidation, processRegistration);

// -- account management routes -- 

// GET /users/list - Display all registered users
// FIX THIS: may want to change hardcoded role name
router.get('/users/list', requireRole('admin'), showAllUsers);

// GET /users/:id/edit - Display edit account form
router.get('/users/:id/edit', requireLogin, showEditAccountForm);

// POST /users/:id/edit - Process account edit
router.post('/users/:id/edit', requireLogin, editValidation, processEditAccount);

// POST /users/:id/delete - Delete user account
router.post('/users/:id/delete', requireLogin, processDeleteAccount);

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

// GET /forms/recipes/:recipeId/edit - Display recipe edit form
router.get('/recipes/:recipeId/edit', requireLogin, showEditRecipeForm);

// POST /forms/recipes/:recipeId/edit - Handles changes made to an existing recipe with validation
router.post('/recipes/:recipeId/edit', requireLogin, recipeValidation, handleRecipeEdit);

// GET /recipes/manage - Display user's submitted recipes (basic user)/recipes awaiting approval (admin)
router.get('/recipes/manage', requireLogin, recipeManagePage);

export default router;