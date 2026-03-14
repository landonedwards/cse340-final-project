
// display the login form
const showLoginForm = (req, res) => {
    // render the login form view
    res.render('forms/login/form', {
        // pass title: 'User Login'
        title: 'User Login'
    });
}

export {
    showLoginForm
}