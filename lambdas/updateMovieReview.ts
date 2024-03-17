import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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

    // 解构请求体以获取更新后的评论文本数据
    const { review } = requestBody;

    // 解析路径参数以获取电影ID和评论员名称
    const pathParams = event.pathParameters;
    if (!pathParams) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing path parameters" }),
      };
    }

    const movieId = pathParams.movieId;
    const reviewerName = pathParams.reviewerName;

    // 检查必需的字段是否存在
    if (!movieId || !reviewerName || !review) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required parameters" }),
      };
    }

    // 更新评论文本到 DynamoDB 表中
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          movieId: { S: movieId },
          reviewerName: { S: reviewerName },
        },
        UpdateExpression: "SET review = :review",
        ExpressionAttributeValues: {
          ":review": { S: review },
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Review text updated successfully" }),
    };
  } catch (error: any) {
    console.error("Error updating review text:", error);
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