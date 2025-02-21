import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

interface InfrastructureStackProps extends cdk.StackProps {
  environment: 'development' | 'production';
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const isDev = props.environment === 'development';
    const domain = isDev ? 'dev.brightcharge.net' : 'brightcharge.net';

    // Hosted zone for brightcharge.net
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'brightcharge.net',
    });

    // Certificate with DNS validation
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: domain,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // S3 bucket for website hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: isDev,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: `OAI for ${id}`,
    });

    // Grant read permissions to CloudFront
    const bucketPolicyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [websiteBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
    });
    websiteBucket.addToResourcePolicy(bucketPolicyStatement);

    // Custom Cache Policy
    const cachePolicy = new cloudfront.CachePolicy(this, 'CachePolicy', {
      defaultTtl: cdk.Duration.days(1),
      minTtl: cdk.Duration.minutes(1),
      maxTtl: cdk.Duration.days(365),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Authorization'),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
    });

    // Function to handle SPA routing
    const rewriteFunction = new cloudfront.Function(this, 'RewriteFunction', {
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var uri = request.uri;
          
          // Check whether the URI is missing a file extension
          if (!uri.includes('.')) {
            request.uri = '/index.html';
          }
          
          return request;
        }
      `),
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity,
          originPath: '/',
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy,
        compress: true,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        functionAssociations: [{
          function: rewriteFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        }],
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      comment: `Distribution for ${id}`,
      certificate,
      domainNames: [domain],
    });

    // Route53 A Record
    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: isDev ? 'dev' : undefined,
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // Deploy website contents
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../dist')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      cacheControl: [
        s3deploy.CacheControl.setPublic(),
        s3deploy.CacheControl.maxAge(cdk.Duration.days(365)),
        s3deploy.CacheControl.sMaxAge(cdk.Duration.days(365)),
      ],
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `${id}-CloudFrontDomain`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: websiteBucket.bucketName,
      description: 'Website Bucket Name',
      exportName: `${id}-BucketName`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `${id}-DistributionId`,
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: domain,
      description: 'Domain Name',
      exportName: `${id}-DomainName`,
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
      description: 'Certificate ARN',
      exportName: `${id}-CertificateArn`,
    });
  }
}