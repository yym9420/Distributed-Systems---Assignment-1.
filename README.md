# Serverless REST web API.
Name: YimingYu

Video demonstration: ..... URL of your Youtube video demonstration ....

API endpoints.

POST /movies/reviews - add a movie review.
GET /movies/{movieId}/reviews - Get all the reviews for the specified movie.
GET /movies/{movieId}/reviews?minRating=n - Get the reviews for the specified movie with a rating greater than the minRating.
GET /movies/{movieId}/reviews/{reviewerName} - Get the review written by the named reviewer for the specified movie.
PUT /movies/{movieId}/reviews/{reviewerName} - Update the text of a review.
GET /movies/{movieId}/reviews/{year} - Get the reviews written in a specific year for a specific movie.
GET /reviews/{reviewerName} - Get all the reviews written by a specific reviewer.
GET /reviews/{reviewerName}/{movieId}/translation?language=code - Get a translated version of a movie review using the movie ID and reviewer name as the identifier.<img width="334" alt="截屏2024-03-18 03 04 11" src="https://github.com/yym9420/Distributed-Systems---Assignment-1./assets/75300047/c76ac65d-cbb9-4f62-aa02-08d7f3875bd8">
<img width="354" alt="截屏2024-03-18 03 04 31" src="https://github.com/yym9420/Distributed-Systems---Assignment-1./assets/75300047/0afc2296-e4c6-4c8a-9498-1477fca853c9">
<img width="278" alt="截屏2024-03-18 03 04 41" src="https://github.com/yym9420/Distributed-Systems---Assignment-1./assets/75300047/52923185-2072-4dc6-a56c-e85967957084">
