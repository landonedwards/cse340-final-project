import { Router } from 'express';
import { homePage } from './index.js';
import { showRegistrationForm, showEditAccountForm, showAllUsers, processRegistration, processEditAccount, processDeleteAccount } from './forms/registration.js';
import { showLoginForm, processLogin, processLogout, showDashboard } from './forms/login.js';
import { showRecipeForm, handleRecipeSubmission, recipeListPage, recipeDetailPage, recipeManagePage, showEditRecipeForm, handleRecipeEdit, processApproveRecipe, processRejectRecipe, processDeleteRecipe } from './recipes/recipe.js';
import { processDeleteReview, handleReviewEdit } from './reviews/review.js';
import { recipeValidation, reviewValidation, registrationValidation, loginValidation, editValidation } from '../middleware/validation/forms.js';

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

// GET /dashboard - Display user's dashboard
router.get('/dashboard', requireLogin, showDashboard);

// --- recipe routes --- 

// GET /recipes - Display the general recipe catalog page
router.get('/recipes', recipeListPage);

// GET /recipes/upload - Display recipe upload form
router.get('/recipes/upload', requireLogin, showRecipeForm);

// POST /recipes/upload - Handles recipes form submission with validation
router.post('/recipes/upload', requireLogin, recipeValidation, handleRecipeSubmission);

// GET /recipes/manage - Display user's submitted recipes (basic user)/recipes awaiting approval (admin)
router.get('/recipes/manage', requireLogin, recipeManagePage);

// GET /recipes/:recipeId - Display recipe detail page 
router.get('/recipes/:recipeId', recipeDetailPage);

// GET /forms/recipes/:recipeId/edit - Display recipe edit form
router.get('/recipes/:recipeId/edit', requireLogin, showEditRecipeForm);

// POST /forms/recipes/:recipeId/edit - Handles changes made to an existing recipe with validation
router.post('/recipes/:recipeId/edit', requireLogin, recipeValidation, handleRecipeEdit);

// POST /forms/recipes/:recipeId/delete - Delete recipe
router.post('/recipes/:recipeId/delete', requireLogin, processDeleteRecipe);

// POST /recipes/:recipeId/approve - Set approval status to 'Approved'
router.post('/recipes/:recipeId/approve', requireRole('admin'), processApproveRecipe);

// POST /recipes/:recipeId/reject - Set approval status to 'Rejected'
router.post('/recipes/:recipeId/reject', requireRole('admin'), processRejectRecipe);

// -- review routes --

// POST /recipes/:recipeId/reviews - Handles review upload with validation 
router.post('/recipes/:recipeId/reviews', requireLogin, reviewValidation, processReviewSubmission);

// POST /reviews/:reviewId/edit - Handles review edit with validation
router.post('/reviews/:reviewId/edit', requireLogin, reviewValidation, handleReviewEdit);

// POST /reviews/:reviewId/delete - Delete comment
router.post('/reviews/:reviewId/delete', requireLogin, processDeleteReview);

export default router;