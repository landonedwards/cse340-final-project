import { getRecipe, getAllRecipes, getRecipesByCategory, saveRecipe, updateRecipe, deleteRecipe, getPendingRecipes, getUserRecipes} from '../../models/recipes/recipes.js';
import { getAllCategories } from '../../models/categories/categories.js';
import { validationResult } from 'express-validator';

// route handler for the recipe catalog list page
const recipeListPage = async (req, res) => {   
    // express 5 automatically passes thrown errors to global error handler  
    const recipes = await getAllRecipes();

    res.render('recipes/list', {
        title: 'Recipe Catalog',
        recipes: recipes
    });
};

// route handler for individual recipe detail pages
const recipeDetailPage = async (req, res, next) => {
    const recipeId = req.params.recipeId;
    const recipe = await getRecipe(recipeId); 
    
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

const recipeManagePage = async (req, res) => {
    let recipes = [];
    
    const user = req.session.user;
    const isAdmin = user.roleName == 'admin';

    // if user is admin, grab all recipes awaiting approval
    if (isAdmin) {
        recipes = await getPendingRecipes();
    }
    // otherwise, just grab user's submitted recipes
    else {
        recipes = await getUserRecipes(user.id);  
    }

    res.render('recipes/manage', {
        title: isAdmin ? 'Pending Recipe Queue' : 'Manage My Recipes',
        recipes: recipes,
        // lets view know what data and format to display
        isAdmin: isAdmin
    });
};

// route handler to show recipe form
const showRecipeForm = async (req, res) => {
    const categories = await getAllCategories();

    res.render('forms/recipes/form', {
        title: 'Upload a Recipe',
        categories: categories
    });
};

// route handler to show edit recipe form
const showEditRecipeForm = async (req, res) => {
    let targetRecipeId = parseInt(req.params.recipeId);
    const targetRecipe = await getRecipe(targetRecipeId);

    // confirm targetRecipe exists
    if (Object.keys(targetRecipe).length === 0) {
        req.flash('error', 'Recipe not found.');
        return res.redirect('/recipes/list');
    }

    // grab user and check permissions
    const currentUser = req.session.user;
    // author of the recipe and admins can edit 
    const canEdit = currentUser.id === targetRecipe.userId || currentUser.roleName === 'admin';

    if (!canEdit) {
        req.flash('error', 'You do not have permission to edit this recipe.');
        return res.redirect('/recipes/list');
    }

    const categories = await getAllCategories();

    res.render('forms/recipes/edit', {
        title: 'Edit Recipe',
        recipe: targetRecipe,
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

    // grab logged-in user's ID
    const userId = req.session.user.id;

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

const handleRecipeEdit = async (req, res) => {
    // extract recipe ID from route parameter
    const recipeId = parseInt(req.params.recipeId);
    // check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // store each validation error as a separate flash message
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        // redirect back to form without saving
        return res.redirect(`/recipes/${recipeId}/edit`);
    }

    // confirm recipe with that ID exists 
    const targetRecipe = await getRecipe(recipeId);
    if (Object.keys(targetRecipe).length === 0) {
        req.flash('error', 'Recipe not found.');
        return res.redirect('/recipes/manage');
    }

    const currentUser = req.session.user;
    const canEdit = currentUser.id === targetRecipe.userId || currentUser.roleName === 'admin';

    // ensure user has necessary permission to edit recipe
    if (!canEdit) {
        req.flash('error', 'You do not have permission to edit this recipe.');
        return res.redirect('/recipes/manage');
    }

    // extract validated data
    const { title, description, ingredients, instructions } = req.body;
    // if categoryId is an empty string, convert it to null for PostgreSQL
    const categoryId = req.body.categoryId ? req.body.categoryId : null;

    try {
        // save changes to database
        await updateRecipe(recipeId, categoryId, title, description, ingredients, instructions);
        // after successfully saving to the database
        req.flash('success', 'Thank you for updating this recipe! We will review the changes as soon as we can.');
        // redirect to 'manage my recipes' page on success
        res.redirect('/recipes/manage');
    } catch (error) {
        console.error('Error updating recipe form:', error);
        req.flash('error', 'Unable to change your recipe. Please try again later.');
        res.redirect('/recipes/manage');
    }
}

export { recipeListPage, 
         recipeDetailPage, 
         recipeManagePage,
         showRecipeForm, 
         showEditRecipeForm,
         handleRecipeSubmission,
         handleRecipeEdit };