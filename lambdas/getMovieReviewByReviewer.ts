import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    const movieId = event.pathParameters?.movieId;
    const reviewerName = event.pathParameters?.reviewerName;
    if (!movieId || !reviewerName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing movieId or reviewerName parameter" }),
      };
    }

    const queryParams = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "movieId = :id AND reviewerName = :name",
      ExpressionAttributeValues: {
        ":id": movieId,
        ":name": reviewerName,
      },
    };

    const commandOutput = await ddbDocClient.send(new QueryCommand(queryParams));

    return {
      statusCode: 200,
      body: JSON.stringify(commandOutput.Items),
    };
  } catch (error: any) {
    console.error("Error fetching movie review by reviewer:", error);
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