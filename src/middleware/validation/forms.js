import { body } from 'express-validator';

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

export { recipeValidation };