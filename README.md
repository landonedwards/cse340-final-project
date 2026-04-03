## Project Description
My application acts as a platform where anyone can upload, view, and comment on others' recipes. It is for people who enjoy finding and sharing recipes. 

## Database Schema
![ERD](https://github.com/user-attachments/assets/735c43d5-471c-453e-a65c-1f1ed18e135e")

## User Roles
- **Admin**: Administrator with full system access.

- **Moderator**: A user with elevated access to edit recipes, delete inappropriate reviews, and approve/reject new recipes.

- **User**: Can edit their credentials, create and upload recipes, and leave reviews on recipes. They have the access to edit and delete anything they upload, including recipes and reviews. 

## Test Account Credentials
- **Admin**: TestAdmin/admin@test.com
- **Moderator**: TestMod/mod@test.com
- **User**: TestUser/user@test.com

## Known Limitations
- Admins cannot add new or edit the list of recipe categories to select from.
- The average rating of recipes is not displayed (there is a getRecipeAverageRating controller function in models/reviews/reviews.js but it isn't used anywhere).
- There is a recipe images table, but it is not utilized. Additionally, there is no functionality to add/modify images for recipes. 
- The application lacks styling/UI polish. 
 
### Deployment URL
https://cse340-final-project-tzak.onrender.com
