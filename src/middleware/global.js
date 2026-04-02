/**
 * Express middleware that adds head asset management functionality to routes.
 * Provides arrays for storing CSS and JS assets with priority support.
 * 
 * Adds these methods to the response object:
 * - res.addStyle(css, priority) - Add CSS/link tags to head
 * - res.addScript(js, priority) - Add script tags 
 * 
 * Adds these functions to EJS templates via res.locals:
 * - renderStyles() - Outputs all CSS in priority order (high to low)
 * - renderScripts() - Outputs all JS in priority order (high to low)
 */
const setHeadAssetsFunctionality = (res) => {
    res.locals.styles = [];
    res.locals.scripts = [];

    res.addStyle = (css, priority = 0) => {
        res.locals.styles.push({ content: css, priority });
    };

    res.addScript = (js, priority = 0) => {
        res.locals.scripts.push({ content: js, priority });
    };

    // These functions will be available in EJS templates
    res.locals.renderStyles = () => {
        return res.locals.styles
            // Sort by priority: higher numbers load first
            .sort((a, b) => b.priority - a.priority)
            .map(item => item.content)
            .join('\n');
    };

    res.locals.renderScripts = () => {
        return res.locals.scripts
            // Sort by priority: higher numbers load first
            .sort((a, b) => b.priority - a.priority)
            .map(item => item.content)
            .join('\n');
    };
};

// middleware to add local variables to res.locals for use in all templates.
export const addLocalVariables = (req, res, next) => {
    // make current year available to templates
    res.locals.currentYear = new Date().getFullYear();
    // make NODE_ENV available to templates
    res.locals.NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
    // make query parameters available to templates
    res.locals.queryParams = { ...req.query };

    // gives every request access to asset management methods
    setHeadAssetsFunctionality(res);

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