import { validationResult } from 'express-validator';
import { findUserByUsernameOrEmail, verifyPassword } from '../../models/forms/login.js';

/**
 * Display the login form.
 */
const showLoginForm = (req, res) => {
    // render the login form view (forms/login/form)
    res.render('forms/login/form', {
        // pass title: 'User Login'
        title: 'User Login'
    });
};

/**
 * Process login form submission.
 */
const processLogin = async (req, res) => {
    // check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        // redirect back to /login
        return res.redirect('/login');
    }

    // extract usernameOrEmail and password from req.body
    const { usernameOrEmail, password } = req.body;

    try {
        // find user by passing usernameOrEmail to findUserByUsernameOrEmail()
        const user = await findUserByUsernameOrEmail(usernameOrEmail);
        if (!user) {
            // if not found, log "User not found" and redirect to /login
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        // verify password using verifyPassword(password, user.password_hash)
        const passwordVerified = await verifyPassword(password, user.password_hash);
        if (!passwordVerified) {
            // if password incorrect, log "Invalid password" and redirect to /login
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        // SECURITY: Remove password from user object before storing in session
        delete user.password_hash;

        // Store user in session: req.session.user = user
        req.session.user = user;
        // creates a flash message with a personalized welcome message
        req.flash('success', `Welcome, ${user.username}`);
        // Redirect to /dashboard
        return res.redirect('/dashboard');
    } catch (error) {
        // model functions do not catch errors, so handle them here
        // log error to console
        console.error('Error:', error);
        // Redirect to /login
        return res.redirect('/login');
    }
};

/**
 * Handle user logout.
 * 
 * NOTE: connect.sid is the default session cookie name since we did not
 * specify a custom name when creating the session in server.js.
 */
const processLogout = (req, res) => {
    // First, check if there is a session object on the request
    if (!req.session) {
        // If no session exists, there's nothing to destroy,
        // so we just redirect the user back to the home page
        return res.redirect('/');
    }

    // Call destroy() to remove this session from the store (PostgreSQL in our case)
    req.session.destroy((err) => {
        if (err) {
            // If something goes wrong while removing the session from the database:
            console.error('Error destroying session:', err);

            /**
             * Clear the session cookie from the browser anyway, so the client
             * does not keep sending an invalid session ID.
             */
            res.clearCookie('connect.sid');

            /** 
             * Normally we would respond with a 500 error since logout did not fully succeed.
             * Example: return res.status(500).send('Error logging out');
             * 
             * Since this is a practice site, we will redirect to the home page anyway.
             */
            return res.redirect('/');
        }

        // If session destruction succeeded, clear the session cookie from the browser
        res.clearCookie('connect.sid');

        // Redirect the user to the home page
        res.redirect('/');
    });
};

/**
 * Display protected dashboard (requires login).
 */
const showDashboard = (req, res) => {
    const user = req.session.user;
    const sessionData = req.session;

    // security check! Ensure user and sessionData do not contain password field
    if (user && user.password) {
        console.error('Security error: password found in user object');
        delete user.password_hash;
    }
    if (sessionData.user && sessionData.user.password) {
        console.error('Security error: password found in sessionData.user');
        delete sessionData.user.password_hash;
    }

    // render the dashboard view (dashboard)
    res.render('dashboard', {
        // pass title: 'Dashboard', user, and sessionData to template
        title: 'Dashboard',
        user: user,
        sessionData: sessionData
    });
};

export { processLogout, 
         showDashboard, 
         processLogin, 
         showLoginForm };