// middleware to add local variables to res.locals for use in all templates.
export const addLocalVariables = (req, res, next) => {
    // make current year available to templates
    res.locals.currentYear = new Date().getFullYear();
    // make NODE_ENV available to templates
    res.locals.NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
    // make query parameters available to templates
    res.locals.queryParams = { ...req.query };
    // convenience variable for UI state based on session state
    res.locals.isLoggedIn = false;
    if (req.session && req.session.user) {
        res.locals.isLoggedIn = true;
    }

    res.locals.isAdmin = req.session.user && req.session.user.roleName === 'admin';
    res.locals.isModerator = req.session.user && req.session.user.roleName === 'moderator';
    // for tasks both admins and moderators can do
    res.locals.isStaff = res.locals.isAdmin || res.locals.isModerator;
    
    next();
};