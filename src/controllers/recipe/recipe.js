import { getRecipe, getAllRecipes, getRecipesByCategory, saveRecipe, updateRecipe, deleteRecipe} from '../../models/recipe/recipe.js';

// route handler for the recipe catalog list page
const recipeListPage = async (req, res) => {
    let recipes = [];
    
    try {
        recipes = await getAllRecipes();
    } catch (error) {
        console.error('Error retrieving recipes:', error);
    }

    res.render('recipe/list', {
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

    res.render('recipe/detail', {
        title: `${recipe.title} - ${recipe.authorName}`,
        recipe: recipe,
        ingredientsList: ingredientsArray,
        instructionsList: instructionsArray
    });
};

export { recipeListPage, recipeDetailPage };