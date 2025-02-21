import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

interface BrightChargeStackProps extends cdk.StackProps {
  environment: 'development' | 'production';
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BrightChargeStackProps) {
    super(scope, id, props);

    const isDev = props.environment === 'development';
    const domain = isDev ? 'dev.brightcharge.net' : 'brightcharge.net';

    // VPC
    const vpc = new ec2.Vpc(this, 'BrightChargeVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // EC2 Instance
    const instanceType = isDev ? ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO)
                              : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL);

    const ec2Instance = new ec2.Instance(this, 'BrightChargeInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType,
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'BrightChargeALB', {
      vpc,
      internetFacing: true,
    });

    // Certificate (DNS validation)
    const certificate = new acm.Certificate(this, 'BrightChargeCert', {
      domainName: domain,
      validation: acm.CertificateValidation.fromEmail(), // Using email validation since we don't have Route53
    });

    // ALB Listener
    const listener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    listener.addTargets('WebTarget', {
      port: 80,
      targets: [ec2Instance],
      healthCheck: {
        path: '/health',
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 5,
        interval: cdk.Duration.seconds(30),
      },
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'BrightChargeCDN', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(alb),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      certificate,
      domainNames: [domain],
    });

    // Output CloudFront domain and distribution ID
    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });
  }
}