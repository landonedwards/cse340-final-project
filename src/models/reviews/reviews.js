import db from '../db.js';

/**
 * Core function to get a single review by ID.
 * 
 * @param {string|number} id - Review ID 
 * @returns {Promise<Object>} Review object with review info, or empty object if not found
 */
const getReview = async (id) => {
    const query = `
        SELECT r.id, r.user_id, r.recipe_id, r.rating, r.comment, r.created_at, 
               u.username as author_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    // return empty object if review not found
    if (result.rows.length === 0) return {};
    
    const review = result.rows[0];
    return {
        id: review.id,
        userId: review.user_id,
        recipeId: review.recipe_id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        authorName: review.author_name
    };
};

/**
 * Retrieves all reviews for a specific recipe.
 * Ordered by newest first.
 * @param {string|number} recipeId - The ID of the recipe
 * @returns {Promise<Array>} Array of review objects, or empty array if none exist
 */
const getReviewsByRecipe = async (recipeId) => {
    const query = `
        SELECT r.id, r.user_id, r.recipe_id, r.rating, r.comment, r.created_at, 
               u.username as author_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.recipe_id = $1
        ORDER BY r.created_at DESC
    `;
    
    const result = await db.query(query, [recipeId]);
    
    // if there are no rows, it safely returns an empty array
    return result.rows.map(review => ({
        id: review.id,
        userId: review.user_id,
        recipeId: review.recipe_id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        authorName: review.author_name
    }));
};

/**
 * Saves a new review to the database.
 * @param {string|number} userId - ID of the user writing the review
 * @param {string|number} recipeId - ID of the recipe being reviewed
 * @param {number} rating - Star rating (1-5)
 * @param {string} comment - The review text
 * @returns {Promise<number>} The ID of the newly created review
 */
const saveReview = async (userId, recipeId, rating, comment) => {
    const query = `
        INSERT INTO reviews (user_id, recipe_id, rating, comment)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
    `;
    
    const result = await db.query(query, [userId, recipeId, rating, comment]);
    return result.rows[0].id;
};

/**
 * Updates an existing review.
 * @param {string|number} reviewId - The ID of the review to update
 * @param {number} rating - The new star rating (1-5)
 * @param {string} comment - The new review text
 * @returns {Promise<boolean>} True if update was successful
 */
const updateReview = async (reviewId, rating, comment) => {
    const query = `
        UPDATE reviews
        SET rating = $1, comment = $2
        WHERE id = $3
    `;
    
    const result = await db.query(query, [rating, comment, reviewId]);
    // returns true if exactly 1 row was modified
    return result.rowCount === 1; 
};

/**
 * Deletes a review from the database.
 * @param {string|number} reviewId - The ID of the review to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
const deleteReview = async (reviewId) => {
    const query = `
        DELETE FROM reviews
        WHERE id = $1
    `;
    
    const result = await db.query(query, [reviewId]);
    return result.rowCount === 1;
};

/**
 * Calculates the average rating and total review count for a recipe.
 * @param {string|number} recipeId - The ID of the recipe
 * @returns {Promise<Object>} Object with averageRating and totalReviews
 */
const getRecipeAverageRating = async (recipeId) => {
    const query = `
        SELECT ROUND(AVG(rating), 1) AS average_rating, COUNT(id) AS total_reviews
        FROM reviews
        WHERE recipe_id = $1
    `;
    
    const result = await db.query(query, [recipeId]);
    const row = result.rows[0];
    
    return {
        // if there are no reviews yet, AVG returns null, so we default it to 0
        averageRating: row.average_rating ? parseFloat(row.average_rating) : 0,
        totalReviews: parseInt(row.total_reviews)
    };
};

export { 
    getReview, 
    getReviewsByRecipe, 
    saveReview, 
    updateReview, 
    deleteReview,
    getRecipeAverageRating
};