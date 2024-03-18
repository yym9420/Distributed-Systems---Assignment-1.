import * as apig from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
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
      runtime: lambda.Runtime.NODEJS_16_X, // 将此行更改为正确的运行时版本
      entry: `${__dirname}/../lambdas/addMovieReview.ts`,
      handler: "handler",
      environment: {
        MOVIE_REVIEWS_TABLE_NAME: movieReviewsTable.tableName,
      },
    });

    const getMovieReviewByReviewerFn = new lambdanode.NodejsFunction(this, "GetMovieReviewByReviewerFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/getMovieReviewByReviewer.ts`,
      handler: "handler",
    });

    const getMovieReviewsFn = new lambdanode.NodejsFunction(this, "GetMovieReviewsFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/getMovieReviews.ts`,
      handler: "handler",
      environment: {
        MOVIE_REVIEWS_TABLE_NAME: movieReviewsTable.tableName,
      },
    });

    const getMovieReviewsByYearFn = new lambdanode.NodejsFunction(this, "GetMovieReviewsByYearFn", {
      runtime: lambda.Runtime.NODEJS_16_X, // 将此行更改为正确的运行时版本
      entry: `${__dirname}/../lambdas/getMovieReviewsByYear.ts`,
      handler: "handler",
      environment: {
        MOVIE_REVIEWS_TABLE_NAME: movieReviewsTable.tableName,
      },
    });

    const getMovieReviewsWithMinRatingFn = new lambdanode.NodejsFunction(this, "GetMovieReviewsWithMinRatingFn", {
      runtime: lambda.Runtime.NODEJS_16_X, // 将此行更改为正确的运行时版本
      entry: `${__dirname}/../lambdas/getMovieReviewsWithMinRating.ts`,
      handler: "handler",
      environment: {
        MOVIE_REVIEWS_TABLE_NAME: movieReviewsTable.tableName,
      },
    });

    const getReviewsByReviewerFn = new lambdanode.NodejsFunction(this, "GetReviewsByReviewerFn", {
      runtime: lambda.Runtime.NODEJS_16_X, // 更改此行以使用新的运行时版本
      entry: `${__dirname}/../lambdas/getReviewsByReviewer.ts`,
      handler: "handler",
      environment: {
        MOVIE_REVIEWS_TABLE_NAME: movieReviewsTable.tableName,
      },
    });

    const getReviewTranslationFn = new lambdanode.NodejsFunction(this, "GetReviewTranslationFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/getReviewTranslation.ts`,
      handler: "handler",
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
    movieReviewsTable.grantReadWriteData(getMovieReviewByReviewerFn);
    movieReviewsTable.grantReadData(getMovieReviewsFn);
    movieReviewsTable.grantReadData(getMovieReviewsByYearFn);
    movieReviewsTable.grantReadData(getMovieReviewsWithMinRatingFn);
    movieReviewsTable.grantReadData(getReviewsByReviewerFn);
    movieReviewsTable.grantReadData(getReviewTranslationFn);
    movieReviewsTable.grantReadWriteData(updateMovieReviewFn);

    // API Gateway
    const api = new apig.RestApi(this, "RestAPI", {
      description: "Demo API",
      deployOptions: {
        stageName: "dev",
      },
    });

    // Define API endpoints
    const moviesReviewsResource = api.root.addResource("movies").addResource("reviews");

moviesReviewsResource.addMethod("POST", new apig.LambdaIntegration(addMovieReviewFn));
moviesReviewsResource.addMethod("GET", new apig.LambdaIntegration(getMovieReviewsFn));

api.root.addResource("reviewsByReviewer").addResource("{reviewerName}")
  .addMethod("GET", new apig.LambdaIntegration(getMovieReviewByReviewerFn, {
    requestTemplates: {
      "application/json": `{
        "reviewerName": "$input.params('reviewerName')",
        "queryStringParameters": $input.json('$querystring')
      }`
    }
  }));

api.root.addResource("reviews").addResource("{reviewerName}")
  .addResource("{movieId}")
  .addResource("translation")
  .addMethod("GET", new apig.LambdaIntegration(getReviewTranslationFn));

// 第一个资源路径为 moviesById/{movieId}/reviews/{reviewerName}
api.root.addResource("moviesById").addResource("{movieId}")
  .addResource("reviewsByReviewer").addResource("{reviewerName}")
  .addMethod("PUT", new apig.LambdaIntegration(updateMovieReviewFn));

// 第二个资源路径为 moviesByYear/{movieId}/reviews/{year}
api.root.addResource("moviesByYear").addResource("{movieId}")
  .addResource("reviewsByYear").addResource("{year}")
  .addMethod("GET", new apig.LambdaIntegration(getMovieReviewsByYearFn));

// 第三个资源路径为 moviesMinRating/{movieId}/reviews/minRating/{n}
api.root.addResource("moviesMinRating").addResource("{movieId}")
  .addResource("reviewsMinRating").addResource("minRating").addResource("{n}")
  .addMethod("GET", new apig.LambdaIntegration(getMovieReviewsWithMinRatingFn));
}
}