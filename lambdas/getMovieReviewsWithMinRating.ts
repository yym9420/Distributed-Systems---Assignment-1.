import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    const movieId = event.pathParameters?.movieId;
    if (!movieId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing movieId parameter" }),
      };
    }

    let minRating = event.queryStringParameters?.minRating;
    let queryParams: any = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "movieId = :id",
      ExpressionAttributeValues: {
        ":id": movieId,
      },
    };

    if (minRating) {
      queryParams.FilterExpression = "rating > :rating";
      queryParams.ExpressionAttributeValues[":rating"] = Number(minRating);
    }

    const commandOutput = await ddbDocClient.send(new QueryCommand(queryParams));

    return {
      statusCode: 200,
      body: JSON.stringify(commandOutput.Items),
    };
  } catch (error: any) {
    console.error("Error fetching movie reviews:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

function createDynamoDBDocumentClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}