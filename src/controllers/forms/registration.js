import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { emailExists, 
         usernameExists,
         saveUser, 
         getAllUsers,
         getUserById,
         updateUser,
         deleteUser, 
         updateUserRole} from '../../models/forms/registration.js';

/**
 * Display the registration form page.
 */
const showRegistrationForm = (req, res) => {
    res.render('forms/register/form', {
        title: 'User Registration'
    });
};

/**
 * Handle user registration with validation and password hashing.
 */
const processRegistration = async (req, res) => {
    // check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        
        return res.redirect('/register');
    }

    // extract validated data from request body
    const { username, email, password } = req.body;

    try {
        // check if email already exists in database
        const emailAlreadyExists = await emailExists(email);
        // check if username already exists in database
        const usernameAlreadyExists = await usernameExists(username);

        if (emailAlreadyExists) {
            req.flash('warning', 'An account with this email already exists.');
            return res.redirect('/register');
        }

        if (usernameAlreadyExists) {
            req.flash('warning', 'An account with this username already exists.');
            return res.redirect('/register');
        }

        // hash the password before saving to database
        const hashedPassword = await bcrypt.hash(password, 10);

        // save user to database with hashed password
        await saveUser(username, email, hashedPassword);

        req.flash('success', 'User successfully saved to the database.');
        return res.redirect('/login');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'Unable to register user. Please try again later.');
        return res.redirect('/register');
    }
};

/**
 * Display all registered users.
 */
const showAllUsers = async (req, res) => {
    // Initialize users as empty array
    let users = [];

    try {
        users = await getAllUsers();
    } catch (error) {
        console.error('Error retrieving users:', error);
        // users remains empty array on error
    }

    res.render('users/list', {
        title: 'Registered Users',
        users,
        user: req.session && req.session.user ? req.session.user : null
    });
};

/**
 * Display the edit account form
 * Users can edit their own account, admins can edit any account
 */
const showEditAccountForm = async (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const currentUser = req.session.user;

    try {
        const targetUser = await getUserById(targetUserId);

        if (!targetUser) {
            req.flash('error', 'User not found.');
            return res.redirect('/users/list');
        }

        // check permissions: users can edit themselves, admins can edit anyone
        const canEdit = currentUser.id === targetUserId || currentUser.roleName === 'admin';

        if (!canEdit) {
            req.flash('error', 'You do not have permission to edit this account.');
            return res.redirect('/users/list');
        }

        res.render('users/edit', {
            title: 'Edit Account',
            user: targetUser
        });
    } catch (error) {
        console.error('Error retrieving user for edit', error);
        req.flash('error', 'An error occurred while retrieving user for edit. Please try again later.');
        res.redirect('/users/list');
    }
};

/**
 * Process account edit form submission
 */
const processEditAccount = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        return res.redirect(`/users/${req.params.id}/edit`);
    }

    const targetUserId = parseInt(req.params.id);
    const currentUser = req.session.user;
    const { username, email, role } = req.body;

    try {
        const targetUser = await getUserById(targetUserId);

        if (!targetUser) {
            req.flash('error', 'User not found.');
            return res.redirect('/users/list');
        }

        // Check permissions
        const canEdit = currentUser.id === targetUserId || currentUser.roleName === 'admin';

        if (!canEdit) {
            req.flash('error', 'You do not have permission to edit this account.');
            return res.redirect('/users/list');
        }

        // check if new email already exists (and belongs to different user)
        const emailTaken = await emailExists(email);
        if (emailTaken && targetUser.email !== email) {
            req.flash('error', 'An account with this email already exists.');
            return res.redirect(`/users/${targetUserId}/edit`);
        }

        // check if new username already exists (and belongs to different user)
        const usernameTaken = await usernameExists(username);
        if (usernameTaken && targetUser.username !== username) {
            req.flash('error', 'An account with this username already exists.');
            return res.redirect(`/users/${targetUserId}/edit`);
        }

        // update the user
        await updateUser(targetUserId, username, email);

        if (role && currentUser.roleName === 'admin') {
            // prevent admins from locking themselves out (role refers to the new role value)
            if (currentUser.id === targetUserId && role !== 'admin') {
                req.flash('error', 'You cannot change your own admin status.');
            } else {
                await updateUserRole(targetUserId, role);
            }
        }

        // if user edited their own account, update session
        if (currentUser.id === targetUserId) {
            req.session.user.username = username;
            req.session.user.email = email;
        }

        req.flash('success', 'Account updated successfully.');
        res.redirect('/users/list');
    } catch (error) {
        console.error('Error updating account:', error);
        req.flash('error', 'An error occurred while updating the account.');
        res.redirect(`/users/${targetUserId}/edit`);
    }
};

/**
 * Process account deletion
 * Only admins can delete accounts, and they cannot delete themselves
 */
const processDeleteAccount = async (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const currentUser = req.session.user;

    // only admins can delete accounts
    if (currentUser.roleName !== 'admin') {
        req.flash('error', 'You do not have permission to delete accounts.');
        return res.redirect('/users/list');
    }

    // prevent admins from deleting their own account
    if (currentUser.id === targetUserId) {
        req.flash('error', 'You cannot delete your own account.');
        return res.redirect('/users/list');
    }

    try {
        const deleted = await deleteUser(targetUserId);

        if (deleted) {
            req.flash('success', 'User account deleted successfully.');
        } else {
            req.flash('error', 'User not found or already deleted.');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        req.flash('error', 'An error occurred while deleting the account.');
    }

    res.redirect('/users/list');
};

export {
    showRegistrationForm,
    processRegistration,
    showAllUsers,
    showEditAccountForm,
    processEditAccount,
    processDeleteAccount
};