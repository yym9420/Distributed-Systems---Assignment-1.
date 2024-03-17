import * as apig from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from "constructs";

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table for storing user data
    const usersTable = new dynamodb.Table(this, "UsersTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // WARNING: This will delete all data when stack is deleted
      tableName: "Users",
    });

    // Lambda function for user registration
const registerUserFn = new lambdanode.NodejsFunction(this, "RegisterUserFn", {
    runtime: lambda.Runtime.NODEJS_14_X,
    entry: `${__dirname}/../lambdas/registerUser.ts`,
    handler: "handler",
    environment: {
      USERS_TABLE_NAME: usersTable.tableName,
    },
  });
  
  // Lambda function for user login
  const loginUserFn = new lambdanode.NodejsFunction(this, "LoginUserFn", {
    runtime: lambda.Runtime.NODEJS_14_X,
    entry: `${__dirname}/../lambdas/loginUser.ts`,
    handler: "handler",
    environment: {
      USERS_TABLE_NAME: usersTable.tableName,
    },
  });
  
  // Lambda function for user logout (optional)
  const logoutUserFn = new lambdanode.NodejsFunction(this, "LogoutUserFn", {
    runtime: lambda.Runtime.NODEJS_14_X,
    entry: `${__dirname}/../lambdas/logoutUser.ts`,
    handler: "handler",
  });

    // Grant permissions to Lambda functions to access DynamoDB table
    usersTable.grantReadWriteData(registerUserFn);
    usersTable.grantReadData(loginUserFn);

    // API Gateway
    const api = new apig.RestApi(this, "AuthAPI", {
      description: "Auth API for user authentication",
      deployOptions: {
        stageName: "dev",
      },
    });

    // Define API endpoints
    const authResource = api.root.addResource("auth");
    authResource.addMethod("POST", new apig.LambdaIntegration(registerUserFn));

    authResource.addResource("login").addMethod("POST", new apig.LambdaIntegration(loginUserFn));
    authResource.addResource("logout").addMethod("POST", new apig.LambdaIntegration(logoutUserFn));
  }
}