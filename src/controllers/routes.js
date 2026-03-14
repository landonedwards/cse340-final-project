import { Router } from 'express';
import { showRegistrationForm } from './forms/registration.js';
import { showLoginForm } from './forms/login.js';

// create a new router instance
const router = Router();

// GET /register - Display the registration form
router.get('/register', showRegistrationForm);

// login routes (form and submission)
router.get('/login', showLoginForm);

export default router;