import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // 解析路径参数以获取电影ID和年份
    const pathParams = event.pathParameters;
    if (!pathParams || !pathParams.movieId || !pathParams.year) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required path parameters" }),
      };
    }

    const movieId = pathParams.movieId;
    const year = pathParams.year;

    // 查询特定年份为特定电影撰写的评论
    const queryParams = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "movieId = :id and begins_with(reviewerName, :year)",
      ExpressionAttributeValues: {
        ":id": movieId,
        ":year": year,
      },
    };

    const queryOutput = await ddbDocClient.send(new QueryCommand(queryParams));

    return {
      statusCode: 200,
      body: JSON.stringify(queryOutput.Items),
    };
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
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