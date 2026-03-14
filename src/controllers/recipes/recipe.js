import { getRecipe, getAllRecipes, getRecipesByCategory, saveRecipe, updateRecipe, deleteRecipe} from '../../models/recipes/recipes.js';
import { getAllCategories } from '../../models/categories/categories.js';
import { validationResult } from 'express-validator';

// route handler for the recipe catalog list page
const recipeListPage = async (req, res) => {
    let recipes = [];
    
    try {
        recipes = await getAllRecipes();
    } catch (error) {
        console.error('Error retrieving recipes:', error);
    }

    res.render('recipes/list', {
        title: 'Recipe Catalog',
        recipes: recipes
    });
};

// route handler for individual recipe detail pages
const recipeDetailPage = async (req, res, next) => {
    const recipeId = req.params.recipeId;

    let recipe;
    try {
        recipe = await getRecipe(recipeId);
    } catch (error) {
        console.error('Error retrieving recipe:', error);
    }
    
    // the model returns an empty object when not found (not null) so 
    // we have to use Object.keys
    if (Object.keys(recipe).length === 0) {
        const err = new Error(`Recipe ${recipeId} not found`);
        err.status = 404;
        return next(err);
    }

    // splits recipe text into an array based on newline characters, trims
    // any whitespace, and removes any empty elements 
    const ingredientsArray = recipe.ingredients.split('\n').filter(ingredient => ingredient.trim() !== '');
    const instructionsArray = recipe.instructions.split('\n').filter(instruction => instruction.trim() !== '');

    res.render('recipes/detail', {
        title: `${recipe.title} - ${recipe.authorName}`,
        recipe: recipe,
        ingredientsList: ingredientsArray,
        instructionsList: instructionsArray
    });
};

// route handler to show recipe form
const showRecipeForm = async (req, res) => {
    let categories;

    try {
        categories = await getAllCategories();
    } catch(error) {
        console.error('Error retrieving categories:', error);
    }

    res.render('forms/recipes/form', {
        title: 'Upload a Recipe',
        categories: categories
    });
};

/**
 * Handle recipe form submission with validation.
 * If validation passes, save to database and redirect.
 * If validation fails, log errors and redirect back to form.
 */
const handleRecipeSubmission = async (req, res) => {
    // check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // store each validation error as a separate flash message
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        // redirect back to form without saving
        return res.redirect('/recipes/upload');
    }

    // Extract validated data
    const { title, description, ingredients, instructions } = req.body;

    // COME BACK AND FIX THIS
    // temporary hardcode for USER ID (will replace with req.session.userId)
    const userId = 1;

    // MAY BE A TEMPORARY FIX
    // if categoryId is an empty string, convert it to null for PostgreSQL
    const categoryId = req.body.categoryId ? req.body.categoryId : null;

    try {
        // save to database
        await saveRecipe(userId, categoryId, title, description, ingredients, instructions);
        // after successfully saving to the database
        req.flash('success', 'Thank you for uploading this recipe! We will review it as soon as we can.');
        // redirect to recipes catalog page on success
        res.redirect('/recipes');
    } catch (error) {
        console.error('Error saving recipe form:', error);
        req.flash('error', 'Unable to upload your recipe. Please try again later.');
        res.redirect('/recipes/upload');
    }
};

export { recipeListPage, recipeDetailPage, showRecipeForm, handleRecipeSubmission };