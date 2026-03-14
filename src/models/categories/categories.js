import db from '../db.js';

/**
 * Retrieves all categories from the database.
 * @returns {Promise<Array>} Array of category objects
 */
const getAllCategories = async () => {
    const query = `
        SELECT c.id, c.name
        FROM categories c
        ORDER BY c.name
    `;

    const result = await db.query(query);

    return result.rows.map(category => ({
        id: category.id,
        name: category.name
    }));
};

export { getAllCategories };