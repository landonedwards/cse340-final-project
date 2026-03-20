import db from '../db.js';

/**
 * Checks if an email address is already registered in the database.
 * 
 * @param {string} email - The email address to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
const emailExists = async (email) => {
    const query = `
        SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists
    `;
    const result = await db.query(query, [email]);
    return result.rows[0].exists;
};

/**
 * Checks if a username is already registered in the database.
 * 
 * @param {string} username - The username to check
 * @returns {Promise<boolean>} True if username exists, false otherwise
 */
const usernameExists = async (username) => {
    const query = `
        SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) as exists
    `;
    const result = await db.query(query, [username]);
    return result.rows[0].exists;
};

/**
 * Retrieves all registered users from the database.
 * 
 * @returns {Promise<Array>} Array of user records (without passwords)
 */
const getAllUsers = async () => {
    const query = `
        SELECT id, username, email, created_at
        FROM users
        ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
};

/**
 * Retrieve a single user by ID with role information
 */
const getUserById = async (id) => {
    const query = `
        SELECT 
            users.id,
            users.username,
            users.email,
            users.created_at,
            roles.role_name AS "roleName"
        FROM users
        INNER JOIN roles ON users.role_id = roles.id
        WHERE users.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

/**
 * Saves a new user to the database with a hashed password.
 * 
 * @param {string} username - The user's username
 * @param {string} email - The user's email address
 * @param {string} hashedPassword - The bcrypt-hashed password
 * @returns {Promise<Object>} The newly created user record (without password)
 */
const saveUser = async (username, email, hashedPassword) => {
    const query = `
        INSERT INTO users (username, email, password_hash, role_id)
        VALUES (
            $1, 
            $2, 
            $3,
            -- dynamically grabs the correct role ID
            (SELECT id FROM roles WHERE role_name = 'user')
        )
        RETURNING id, username, email, created_at
    `;
    const result = await db.query(query, [username, email, hashedPassword]);
    return result.rows[0];
};

/**
 * Update a user's username and email
 */
const updateUser = async (id, username, email) => {
    const query = `
        UPDATE users 
        SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, username, email, updated_at
    `;
    const result = await db.query(query, [username, email, id]);
    return result.rows[0] || null;
};

/**
 * Delete a user account
 */
const deleteUser = async (id) => {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
};

export { emailExists,
         usernameExists, 
         saveUser, 
         getAllUsers,
         getUserById,
         updateUser,
         deleteUser };