import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // 获取电影 ID
    const movieId = event.pathParameters?.movieId;
    if (!movieId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing movieId parameter" }),
      };
    }

    // 从 DynamoDB 中获取指定电影的所有评论
    const commandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          movieId: movieId,
        },
      })
    );

    // 检查电影是否存在
    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Movie not found" }),
      };
    }

    // 返回电影的所有评论
    return {
      statusCode: 200,
      body: JSON.stringify(commandOutput.Item.reviews),
    };
  } catch (error: any) {
    console.error("Error getting movie reviews:", error);
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