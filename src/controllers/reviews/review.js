import { validationResult } from 'express-validator';
import { getReview, saveReview, deleteReview, updateReview } from '../../models/reviews/reviews';
import { getRecipe } from '../../models/recipes/recipes';

const processReviewSubmission = async (req, res) => {
    const recipeId = parseInt(req.params.recipeId);
     // check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // store each validation error as a separate flash message
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        // redirect back to form without saving
        return res.redirect(`/recipes/${recipeId}`);
    }

    // confirm recipe with that ID exists 
    const targetRecipe = await getRecipe(recipeId);
    if (Object.keys(targetRecipe).length === 0) {
        req.flash('error', 'Recipe not found.');
        return res.redirect('/recipes/manage');
    }

    // Extract validated data
    const { rating, comment } = req.body;

    // grab logged-in user's ID
    const userId = req.session.user.id;

    try {
        // save to database
        await saveReview(userId, recipeId, rating, comment);
        // after successfully saving to the database
        req.flash('success', 'Success! Your comment was posted!');
    } catch (error) {
        console.error('Error uploading review:', error);
        req.flash('error', 'Unable to upload your comment. Please try again later.');
    }

    res.redirect(`/recipes/${recipeId}`);
};

const handleReviewEdit = async (req, res) => {
    // extract review ID from route parameter
    const reviewId = parseInt(req.params.reviewId);
    const targetReview = await getReview(reviewId);

    // confirm review with that ID exists 
    if (Object.keys(targetReview).length === 0) {
        req.flash('error', 'Review not found.');
        return res.redirect(`/recipes/${targetReview.recipeId}`);
    }

    // check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // store each validation error as a separate flash message
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        // redirect back to form without saving
        return res.redirect(`/recipes/${targetReview.recipeId}`);
    }

    const currentUser = req.session.user;
    const canEdit = currentUser.id === targetReview.userId || currentUser.roleName === 'admin';

    // ensure user has necessary permission to edit recipe
    if (!canEdit) {
        req.flash('error', 'You do not have permission to edit this review.');
        return res.redirect(`/recipes/${targetReview.recipeId}`);
    }

    // extract validated data
    const { rating, comment } = req.body;

    try {
        // save changes to database
        await updateReview(reviewId, rating, comment);
        // after successfully saving to the database
        req.flash('success', 'Success! Review has been updated!');
        // redirect to 'manage my recipes' page on success
    } catch (error) {
        console.error('Error updating review form:', error);
        req.flash('error', 'Unable to change your review. Please try again later.');
    }

    return res.redirect(`/recipes/${targetReview.recipeId}`);
}

const processDeleteReview = async (req, res) => {
    // extract review ID from route parameter
    const reviewId = parseInt(req.params.reviewId);

    // confirm review with that ID exists 
    const targetReview = await getReview(recipeId);
    if (Object.keys(targetReview).length === 0) {
        req.flash('error', 'Review not found.');
        return res.redirect(`/recipes/${targetReview.recipeId}`);
    }

    const currentUser = req.session.user;
    // check whether user is the author or an admin
    const canDelete = currentUser.id === targetReview.userId || currentUser.roleName === 'admin';

    if (!canDelete) {
        req.flash('error', 'You do not have permission to delete this review.');
        return res.redirect(`/recipes/${targetReview.recipeId}`);
    }

    try {
        const deleted = await deleteReview(reviewId);

        if (deleted) {
            req.flash('success', 'Review deleted successfully.');
        } else {
            req.flash('error', 'Review not found or already deleted.');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        req.flash('error', 'An error occurred while deleting the review.');
    }

    res.redirect(`/recipes/${targetReview.recipeId}`);
};

export {
    processReviewSubmission,
    processDeleteReview,
    handleReviewEdit
}