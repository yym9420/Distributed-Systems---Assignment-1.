import * as apig from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from "constructs";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "reviewId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews",
    });

    // Lambda Functions
    const addMovieReviewFn = new lambdanode.NodejsFunction(this, "AddMovieReviewFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/addMovieReview.ts`,
      handler: "handler",
      environment: {
        MOVIE_REVIEWS_TABLE_NAME: movieReviewsTable.tableName,
      },
    });

    const updateMovieReviewFn = new lambdanode.NodejsFunction(this, "UpdateMovieReviewFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/updateMovieReview.ts`,
      handler: "handler",
      environment: {
        MOVIE_REVIEWS_TABLE_NAME: movieReviewsTable.tableName,
      },
    });

    // Grant permissions to Lambda functions to access DynamoDB tables
    moviesTable.grantReadWriteData(addMovieReviewFn);
    movieReviewsTable.grantReadWriteData(updateMovieReviewFn);

    // API Gateway
    const api = new apig.RestApi(this, "RestAPI", {
      description: "Demo API",
      deployOptions: {
        stageName: "dev",
      },
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: { email: true }
    });

    // API Gateway Authorizer using Cognito User Pool
    const authorizer = new apig.CfnAuthorizer(this, 'CognitoAuthorizer', {
      restApiId: api.restApiId,
      name: 'CognitoAuthorizer',
      type: apig.AuthorizationType.COGNITO,
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn]
    });

    // Define API endpoints
    const moviesReviewsResource = api.root.addResource("movies").addResource("reviews");

   // Cognito User Pool Authorizer
const cognitoAuthorizer = new apig.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
    cognitoUserPools: [userPool]
  });
  
  // POST endpoint with authorization
  moviesReviewsResource.addMethod("POST", new apig.LambdaIntegration(addMovieReviewFn), {
    authorizer: cognitoAuthorizer
  });
  
  // PUT endpoint with authorization
  api.root.addResource("movies").addResource("{movieId}")
    .addResource("reviews").addResource("{reviewerName}")
    .addMethod("PUT", new apig.LambdaIntegration(updateMovieReviewFn), {
      authorizer: cognitoAuthorizer
  });
  }
}