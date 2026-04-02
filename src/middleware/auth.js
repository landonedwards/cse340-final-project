/**
 * Middleware to require authentication for protected routes.
 * Redirects to login page if user is not authenticated.
 * Sets res.locals.isLoggedIn = true for authenticated requests.
 */
const requireLogin = (req, res, next) => {
    // check if user is logged in via session
    if (req.session && req.session.user) {
        // user is authenticated - set UI state and continue
        res.locals.isLoggedIn = true;
        next();
    } else {
        // User is not authenticated - redirect to login
        res.redirect('/login');
    }
};

/**
 * Middleware factory to require specific role for route access
 * Returns middleware that checks if user has the required role
 * 
 * @param {string} allowedRoles - The role names required (e.g., 'admin', 'moderator'). 
 * The '...' in front of allowedRoles bundles the values passed into an array.
 * @returns {Function} Express middleware function
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // check if user is logged in first
        if (!req.session || !req.session.user) {
            req.flash('error', 'You must be logged in to access this page.');
            return res.redirect('/login');
        }

        // check if user's role matches the required role
        if (!allowedRoles.includes(req.session.user.roleName)) {
            req.flash('error', 'You do not have permission to access this page.');
            return res.redirect('/');
        }

        // user has a required role, continue
        next();
    };
};

export { requireLogin, requireRoles };