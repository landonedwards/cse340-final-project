
// display the registration form page
const showRegistrationForm = (req, res) => {
    res.render('forms/register/form', {
        title: 'User Registration'
    });
}

export {
    showRegistrationForm
}
