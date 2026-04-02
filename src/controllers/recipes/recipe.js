import { getRecipe, getAllRecipes, getRecipesByCategory, saveRecipe, updateRecipe, deleteRecipe, updateRecipeStatus, getPendingRecipes, getUserRecipes, getRecipeHistory } from '../../models/recipes/recipes.js';
import { getReviewsByRecipe } from '../../models/reviews/reviews.js';
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

    // grab the reviews for this specific recipe
    const reviews = await getReviewsByRecipe(recipeId);

    // if there is a user session, grab user object
    const currentUser = req.session ? req.session.user : null;
    // make sure there is a user stored in session and they are either the author or an admin
    const canModify = currentUser && (currentUser.id === recipe.userId || currentUser.roleName === 'admin');

    res.render('recipes/detail', {
        title: `${recipe.title} - ${recipe.authorName}`,
        recipe: recipe,
        ingredientsList: ingredientsArray,
        instructionsList: instructionsArray,
        canModify: canModify,
        reviews: reviews,
        user: currentUser
    });
};

const recipeManagePage = async (req, res) => {    
    const user = req.session.user;
    const isStaff = user.roleName == 'admin' || user.roleName == 'moderator';

    const recipes = await getUserRecipes(user.id);
    let pendingRecipes = [];

    // if user is admin, grab all recipes awaiting approval
    if (isStaff) {
        pendingRecipes = await getPendingRecipes();
    }

    res.render('recipes/manage', {
        title: isStaff ? 'Pending Recipe Queue' : 'Manage My Recipes',
        recipes: recipes,
        // passes empty array if not admin/moderator
        pendingRecipes: pendingRecipes,
    });
};

const showRecipeHistory = async (req, res, next) => {
    const recipeId = req.params.recipeId;
    const recipe = await getRecipe(recipeId); 
    
    // check that recipe with that ID exists
    if (Object.keys(recipe).length === 0) {
        const err = new Error(`Recipe ${recipeId} not found`);
        err.status = 404;
        return next(err);
    }

    const currentUser = req.session.user;
    const canView = currentUser && (currentUser.id === recipe.userId ||
                                    currentUser.roleName === 'admin' ||
                                    currentUser.roleName === 'moderator');

    if (!canView) {
        req.flash('error', 'You do not have permission to view this recipe\'s history.');
        return res.redirect(`recipes/${recipeId}`);
    }

    const history = await getRecipeHistory(recipeId);

    res.render('recipes/history', {
        title: 'Recipe Status History',
        recipe: recipe,
        history: history
    });
}

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

const processDeleteRecipe = async (req, res) => {
    // extract recipe ID from route parameter
    const recipeId = parseInt(req.params.recipeId);

    // grab the URL the user was just on; defaults to /recipes (catalog view) if unavailable
    let prevURL = req.get('Referrer') || '/recipes';

    // if user deletes recipe on its detail page, redirect them to the main catalog
    // view because the old link is dead
    if (prevURL.includes(`/recipes/${recipeId}`)) {
        prevURL = '/recipes';
    }

    // confirm recipe with that ID exists 
    const targetRecipe = await getRecipe(recipeId);
    if (Object.keys(targetRecipe).length === 0) {
        req.flash('error', 'Recipe not found.');
        return res.redirect(prevURL);
    }

    const currentUser = req.session.user;
    // check whether user is the author or an admin/moderator
    const canDelete = currentUser.id === targetRecipe.userId || currentUser.roleName === 'admin' || currentUser.roleName === 'moderator';

    if (!canDelete) {
        req.flash('error', 'You do not have permission to delete this recipe.');
        return res.redirect(prevURL);
    }

    try {
        const deleted = await deleteRecipe(recipeId);

        if (deleted) {
            req.flash('success', 'Recipe deleted successfully.');
        } else {
            req.flash('error', 'Recipe not found or already deleted.');
        }
    } catch (error) {
        console.error('Error deleting recipe:', error);
        req.flash('error', 'An error occurred while deleting the recipe.');
    }

    res.redirect(prevURL);
};

const processApproveRecipe = async (req, res) => {
    const recipeId = parseInt(req.params.recipeId); 

    // confirm recipe with that ID exists 
    const targetRecipe = await getRecipe(recipeId);
    if (Object.keys(targetRecipe).length === 0) {
        req.flash('error', 'Recipe not found.');
        return res.redirect('/recipes/manage');
    }

    const currentUser = req.session.user;
    const isStaff = currentUser.roleName === 'admin' || currentUser.roleName === 'moderator';

    if (!isStaff) {
        req.flash('error', 'You do not have permission to approve this recipe.');
        return res.redirect('/recipes/manage');
    }

    try {
        const approved = await updateRecipeStatus(recipeId, 'Approved');

        if (approved) {
            req.flash('success', 'Approved recipe and sent to the public catalog!');
        } else {
            req.flash('error', 'Recipe not found or other error occurred.');
        }
        return res.redirect('/recipes/manage');

    } catch (error) {
        console.error('Error approving recipe:', error);
        req.flash('error', 'An error occurred while approving the recipe.');
        return res.redirect('/recipes/manage');
    }
}

const processRejectRecipe = async (req, res) => {
    const recipeId = parseInt(req.params.recipeId); 

    // confirm recipe with that ID exists 
    const targetRecipe = await getRecipe(recipeId);
    if (Object.keys(targetRecipe).length === 0) {
        req.flash('error', 'Recipe not found.');
        return res.redirect('/recipes/manage');
    }

    const currentUser = req.session.user;
    const isStaff = currentUser.roleName === 'admin' || currentUser.roleName === 'moderator';

    if (!isStaff) {
        req.flash('error', 'You do not have permission to reject this recipe.');
        return res.redirect('/recipes/manage');
    }

    try {
        const rejected = await updateRecipeStatus(recipeId, 'Rejected');

        if (rejected) {
            req.flash('success', 'Successfully rejected recipe!');
        } else {
            req.flash('error', 'Recipe not found or other error occurred.');
        }
        return res.redirect('/recipes/manage');

    } catch (error) {
        console.error('Error rejecting recipe:', error);
        req.flash('error', 'An error occurred while rejecting the recipe.');
        return res.redirect('/recipes/manage');
    }
}

export { recipeListPage, 
         recipeDetailPage, 
         recipeManagePage,
         showRecipeForm, 
         showEditRecipeForm,
         handleRecipeSubmission,
         handleRecipeEdit,
         processApproveRecipe,
         processRejectRecipe,
         processDeleteRecipe,
         showRecipeHistory };