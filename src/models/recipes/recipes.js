import db from '../db.js';

// retrieve recipe functions

/**
 * Core function to get a single recipe by ID.
 * 
 * @param {string|number} id - Recipe ID 
 * @returns {Promise<Object>} Recipe object with recipe info, or empty object if not found
 */
const getRecipe = async (id) => {
    // uses a LEFT JOIN so recipes aren't hidden if their category is deleted

    /**
     * Join recipes with categories to get category information.
     * Aliases: r = recipe, c = category
     */
    const query = `
        SELECT r.id, r.user_id, r.category_id, r.title, r.description, r.ingredients, 
               r.instructions, r.approval_status, r.created_at, c.name as category_name,
               u.username as author_name
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        JOIN users u ON r.user_id = u.id
        WHERE r.id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    // return empty object if recipe not found
    if (result.rows.length === 0) return {};
    
    const recipe = result.rows[0];
    return {
        id: recipe.id,
        userId: recipe.user_id,
        categoryId: recipe.category_id,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        approvalStatus: recipe.approval_status,
        categoryName: recipe.category_name,
        authorName: recipe.author_name,
        createdAt: recipe.created_at
    };
};

/**
 * Retrieves all approved recipes for the public catalog.
 * Includes the category name and the author's username.
 * @param {string} sortBy - Sort column ('title', 'username', or 'category')
 * @returns {Promise<Array>} Array of recipe objects
 */
const getAllRecipes = async (sortBy = 'category') => {
    /**
     * Build ORDER BY clause based on sortBy parameter.
     */
    const orderByClause = sortBy === 'title' ? 'r.title':
                          sortBy === 'username' ? 'u.username' :
                          'c.name, u.username'; // by default, sorts by category, then author

    /**
     * JOIN with categories and users to get category/user name/username.
     * Using table aliases (r for recipes, u for users, c for categories) keeps queries readable.
     */
    const query = `
        SELECT r.id, r.user_id, r.category_id, r.title, r.description,
               r.approval_status, r.created_at, c.name as category_name, u.username as author_name
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        JOIN users u ON r.user_id = u.id
        WHERE r.approval_status = 'Approved'
        ORDER BY ${orderByClause}
    `;

    const result = await db.query(query);

    return result.rows.map(recipe => ({
        id: recipe.id,
        userId: recipe.user_id,
        categoryId: recipe.category_id,
        title: recipe.title,
        description: recipe.description,
        approvalStatus: recipe.approval_status,
        categoryName: recipe.category_name,
        authorName: recipe.author_name,
        createdAt: recipe.created_at
    }));
};

/**
 * Get all approved recipes in a specific category.
 * * @param {number} categoryId - The ID of the category
 * @param {string} sortBy - Sort option: 'title' (default), 'username', 'recent'
 * @returns {Promise<Array>} Array of recipe objects in the specified category
 */
const getRecipesByCategory = async (categoryId, sortBy = 'title') => {
    const orderByClause = sortBy === 'recent' ? 'r.created_at DESC' :
                          sortBy === 'username' ? 'u.username' :
                          'r.title'; // default sort
    
    const query = `
        SELECT r.id, r.title, r.description, r.approval_status, r.created_at,
               c.name as category_name, 
               u.username as author_name
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        JOIN users u ON r.user_id = u.id
        WHERE r.category_id = $1 AND r.approval_status = 'Approved'
        ORDER BY ${orderByClause}
    `;
    
    // pass the categoryId to safely replace the $1 parameter
    const result = await db.query(query, [categoryId]);
        
    if (result.rows.length === 0) return [];
        
    return result.rows.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        categoryName: recipe.category_name,
        authorName: recipe.author_name,
        approvalStatus: recipe.approval_status,
        createdAt: recipe.created_at
    }));
};

// send new/modify existing recipe data

/**
 * Saves a new recipe to the database.
 * The approval_status will automatically default to 'Pending'
 * @param {number} userId - The ID of the author
 * @param {number|null} categoryId - The ID of the category (can be null)
 * @param {string} title - The recipe's title
 * @param {string} description - A short description
 * @param {string} ingredients - The ingredients list
 * @param {string} instructions - The step-by-step instructions 
 * @returns {Promise<Object>} The newly created recipe record 
 */
const saveRecipe = async (userId, categoryId, title, description, ingredients, instructions) => {
    const query = `
        INSERT INTO recipes (user_id, category_id, title, description, ingredients, instructions)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, approval_status, created_at
    `;
    const result = await db.query(query, [userId, categoryId, title, description, ingredients, instructions]);
    return result.rows[0];
};

/**
 * Updates an existing recipe.
 * Automatically resets approval_status to 'Pending' so admins can review the changes.
 * @param {number} recipeId - The ID of the recipe to update
 * @param {number|null} categoryId - The new category ID
 * @param {string} title - The new title
 * @param {string} description - The new description
 * @param {string} ingredients - The new ingredients
 * @param {string} instructions - The new instructions
 * @returns {Promise<Object>} The updated recipe record
 */
const updateRecipe = async (recipeId, categoryId, title, description, ingredients, instructions) => {
    const query = `
        UPDATE recipes 
        SET category_id = $1, 
            title = $2, 
            description = $3, 
            ingredients = $4, 
            instructions = $5,
            approval_status = 'Pending' 
        WHERE id = $6
        RETURNING id, title, approval_status
    `;
    
    const result = await db.query(query, [categoryId, title, description, ingredients, instructions, recipeId]);
    return result.rows[0] || null;
};

/**
 * Deletes an existing recipe.
 * @param {number} id - The ID of the recipe to update
 */
const deleteRecipe = async (id) => {
    const query = `
        DELETE FROM recipes
        WHERE id = $1`;
    
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
};

export { getRecipe, 
         getAllRecipes, 
         getRecipesByCategory,
         saveRecipe,
         updateRecipe,
         deleteRecipe };