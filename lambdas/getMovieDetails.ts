import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { movies } from "../seed/movies";

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    const movieId = parseInt(event.pathParameters?.movieId || "");
    const queryParams = event.queryStringParameters || {};
    const includeCast = queryParams.cast === "true";

    const movie = movies.find((movie) => movie.id === movieId);
    if (!movie) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Movie not found" }),
      };
    }

    let responseData: any = {
      id: movie.id,
      title: movie.title,
      
    };

    if (includeCast) {
      responseData = {
        ...responseData,
        
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};