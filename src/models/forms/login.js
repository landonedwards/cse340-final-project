import bcrypt from 'bcrypt';
import db from '../db.js';

/**
 * Find a user by either username or email address for login verification.
 * 
 * @param {string} identifier - The username or email address to search for
 * @returns {Promise<Object|null>} User object with password hash or null if not found
 */
const findUserByUsernameOrEmail = async (identifier) => {
    const query = `
        SELECT 
            users.id, 
            users.username, 
            users.email, 
            users.password, 
            users.created_at,
            roles.role_name AS "roleName"
        FROM users
        INNER JOIN roles ON users.role_id = roles.id
        WHERE LOWER(users.username) = LOWER($1) OR LOWER(users.email) = LOWER($1)
        LIMIT 1
    `;
    const result = await db.query(query, [identifier]);
    return result.rows[0] || null;
};

/**
 * Verify a plain text password against a stored bcrypt hash.
 * 
 * @param {string} plainPassword - The password to verify
 * @param {string} hashedPassword - The stored password hash
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

export { findUserByUsernameOrEmail, verifyPassword };