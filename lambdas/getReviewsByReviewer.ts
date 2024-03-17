import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // 检查路径参数是否存在
    const reviewerName = event.pathParameters?.reviewerName;
    if (!reviewerName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing reviewerName parameter" }),
      };
    }

    // 构造查询参数
    const queryParams = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "reviewerName = :reviewerName",
      ExpressionAttributeValues: {
        ":reviewerName": reviewerName,
      },
    };

    // 查询评论
    const queryOutput = await ddbDocClient.send(new QueryCommand(queryParams));

    // 提取查询结果中的评论列表
    const reviews = queryOutput.Items;

    return {
      statusCode: 200,
      body: JSON.stringify(reviews),
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