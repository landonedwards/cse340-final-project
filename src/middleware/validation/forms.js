import { body } from 'express-validator';
import validator from 'validator'; // for use on usernameOrEmail field (this is a library the express-validator uses)

// validation rules for recipe creation/editing
const recipeValidation = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters')
        // allows accented characters for foods like Crème Brûlée
        .matches(/^[\p{L}0-9\s\-.,'&()\/]+$/u)
        .withMessage('Title contains invalid characters'),
    body('categoryId')
        // skips validation if no categories have been selected
        .optional({ checkFalsy: true })
        .isInt()
        .withMessage('Please select a valid category from the list.'),

    body('description')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 700 })
        .withMessage('Description must be under 700 characters.'),

    body('ingredients')
        .trim()
        .notEmpty()
        .withMessage('Ingredients are required.')
        .custom((value) => {
            // split by newline and remove any blank lines
            const lines = value.split('\n').filter(line => line.trim() !== '');

            // ensure there are at least two ingredients (correctly formatted)
            if (lines.length < 2) {
                throw new Error('Please list at least two ingredients, each on a new line.');
            }
            return true;
        }),

    body('instructions')
        .trim()
        .notEmpty()
        .withMessage('Instructions are required.')
        .custom((value) => {
            const lines = value.split('\n').filter(line => line.trim() !== '');

            if (lines.length < 2) {
                throw new Error('Please provide at least two instruction steps, each on a new line.');
            }
            return true;
        })
];

// validation rules for user registration
const registrationValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        // allows letters, numbers, underscores, hyphens, and periods
        .matches(/^[a-zA-Z0-9_.-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, hyphens, and periods'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Must be a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email address is too long'),
    body('emailConfirm')
        .trim()
        .isEmail()
        .normalizeEmail()
        .custom((value, { req }) => value === req.body.email)
        .withMessage('Email addresses must match'),
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
        .withMessage('Password must contain at least one special character'),
    body('passwordConfirm')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords must match')
];

// validation rules for editing user accounts
const editValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_.-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, hyphens, and periods'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Must be a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email address is too long')
];

// validation rules for login form
const loginValidation = [
    body('usernameOrEmail')
        .trim()
        .notEmpty()
        .withMessage('Please provide your username or email address')
        .customSanitizer(value => {
            // if it looks like an email, use the normalize function
            if (value.includes('@')) {
                // this ensures it matches what was saved during registration
                return validator.normalizeEmail(value);
            }
            // if it's a username, return it the way it was typed
            return value;
        }),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
];

export { recipeValidation,
         registrationValidation,
         editValidation,
         loginValidation
       };