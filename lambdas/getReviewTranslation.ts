import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // 检查路径参数是否存在
    const reviewerName = event.pathParameters?.reviewerName;
    const movieId = event.pathParameters?.movieId;
    if (!reviewerName || !movieId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing reviewerName or movieId parameter" }),
      };
    }

    // 解析查询参数
    const languageCode = event.queryStringParameters?.language;

    // 构造 DynamoDB 查询命令
    const queryParams = {
      TableName: process.env.TABLE_NAME,
      Key: {
        reviewerName: reviewerName,
        movieId: movieId,
      },
    };

    // 发送查询请求
    const queryOutput = await ddbDocClient.send(new GetCommand(queryParams));

    // 提取查询结果中的评论翻译版本
    const translatedReview = queryOutput.Item;

    return {
      statusCode: 200,
      body: JSON.stringify(translatedReview),
    };
  } catch (error: any) {
    console.error("Error fetching translated review:", error);
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