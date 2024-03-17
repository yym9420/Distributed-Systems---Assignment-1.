import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // 检查 event.body 是否存在并且不是 undefined
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    // 解析 JSON 数据
    const requestBody = JSON.parse(event.body);

    // 解构请求体以获取电影评论数据
    const { movieId, reviewerName, review } = requestBody;

    // 检查必需的字段是否存在
    if (!movieId || !reviewerName || !review) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required parameters" }),
      };
    }

    // 添加评论到 DynamoDB 表中
    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          movieId: movieId,
          reviewerName: reviewerName,
          review: review,
        },
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Review added successfully" }),
    };
  } catch (error: any) {
    console.error("Error adding review:", error);
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