"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const elbv2 = __importStar(require("aws-cdk-lib/aws-elasticloadbalancingv2"));
const acm = __importStar(require("aws-cdk-lib/aws-certificatemanager"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
const route53 = __importStar(require("aws-cdk-lib/aws-route53"));
const targets = __importStar(require("aws-cdk-lib/aws-route53-targets"));
const autoscaling = __importStar(require("aws-cdk-lib/aws-autoscaling"));
class InfrastructureStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const isDev = props.environment === 'development';
        const domain = isDev ? 'dev.brightcharge.net' : 'brightcharge.net';
        // Lookup the hosted zone
        const hostedZone = route53.HostedZone.fromLookup(this, 'BrightChargeZone', {
            domainName: 'brightcharge.net',
        });
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
        // Security Group for EC2 instances
        const webServerSG = new ec2.SecurityGroup(this, 'WebServerSG', {
            vpc,
            description: 'Security group for web servers',
            allowAllOutbound: true,
        });
        webServerSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
        // Auto Scaling Group
        const instanceType = isDev ? ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO)
            : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL);
        const asg = new autoscaling.AutoScalingGroup(this, 'BrightChargeASG', {
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            instanceType,
            machineImage: new ec2.AmazonLinuxImage({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
            }),
            minCapacity: 1,
            maxCapacity: isDev ? 1 : 3,
            desiredCapacity: 1,
            securityGroup: webServerSG,
            healthCheck: autoscaling.HealthCheck.elb({ grace: cdk.Duration.seconds(60) }),
        });
        // Application Load Balancer
        const alb = new elbv2.ApplicationLoadBalancer(this, 'BrightChargeALB', {
            vpc,
            internetFacing: true,
        });
        // Certificate (DNS validation)
        const certificate = new acm.Certificate(this, 'BrightChargeCert', {
            domainName: domain,
            validation: acm.CertificateValidation.fromDns(hostedZone),
        });
        // ALB Listener
        const listener = alb.addListener('HttpsListener', {
            port: 443,
            certificates: [certificate],
            protocol: elbv2.ApplicationProtocol.HTTPS,
        });
        listener.addTargets('WebTarget', {
            port: 80,
            targets: [asg],
            healthCheck: {
                path: '/health',
                unhealthyThresholdCount: 2,
                healthyThresholdCount: 5,
                interval: cdk.Duration.seconds(30),
            },
            deregistrationDelay: cdk.Duration.seconds(30),
        });
        // HTTP to HTTPS redirect
        alb.addListener('HttpListener', {
            port: 80,
            defaultAction: elbv2.ListenerAction.redirect({
                protocol: 'HTTPS',
                port: '443',
                permanent: true,
            }),
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
        // Route 53 Alias Record
        new route53.ARecord(this, 'BrightChargeAliasRecord', {
            zone: hostedZone,
            recordName: isDev ? 'dev' : undefined,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
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
        new cdk.CfnOutput(this, 'DomainName', {
            value: domain,
            description: 'Application Domain Name',
        });
    }
}
exports.InfrastructureStack = InfrastructureStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmFzdHJ1Y3R1cmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYXN0cnVjdHVyZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx5REFBMkM7QUFDM0MsOEVBQWdFO0FBQ2hFLHdFQUEwRDtBQUMxRCx1RUFBeUQ7QUFDekQsNEVBQThEO0FBQzlELGlFQUFtRDtBQUNuRCx5RUFBMkQ7QUFDM0QseUVBQTJEO0FBTzNELE1BQWEsbUJBQW9CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDaEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUErQjtRQUN2RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsV0FBVyxLQUFLLGFBQWEsQ0FBQztRQUNsRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQztRQUVuRSx5QkFBeUI7UUFDekIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ3pFLFVBQVUsRUFBRSxrQkFBa0I7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsTUFBTTtRQUNOLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDL0MsTUFBTSxFQUFFLENBQUM7WUFDVCxXQUFXLEVBQUUsQ0FBQztZQUNkLG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO29CQUNqQyxRQUFRLEVBQUUsRUFBRTtpQkFDYjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsU0FB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LENBQUM7UUFFSCwrQ0FBK0M7UUFDL0MsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMxQyxLQUFLLEVBQUUsWUFBWSxDQUFDLHNCQUFzQjtZQUMxQyxXQUFXLEVBQUUscUNBQXFDO1NBQ25ELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLFlBQVksQ0FBQyxjQUFjO1lBQ2xDLFdBQVcsRUFBRSw0QkFBNEI7U0FDMUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDcEMsS0FBSyxFQUFFLE1BQU07WUFDYixXQUFXLEVBQUUseUJBQXlCO1NBQ3ZDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTNJRCxrREEySUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0ICogYXMgYWNtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgcm91dGU1MyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzLXRhcmdldHMnO1xuaW1wb3J0ICogYXMgYXV0b3NjYWxpbmcgZnJvbSAnYXdzLWNkay1saWIvYXdzLWF1dG9zY2FsaW5nJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgSW5mcmFzdHJ1Y3R1cmVTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBlbnZpcm9ubWVudDogJ2RldmVsb3BtZW50JyB8ICdwcm9kdWN0aW9uJztcbn1cblxuZXhwb3J0IGNsYXNzIEluZnJhc3RydWN0dXJlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogSW5mcmFzdHJ1Y3R1cmVTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBpc0RldiA9IHByb3BzLmVudmlyb25tZW50ID09PSAnZGV2ZWxvcG1lbnQnO1xuICAgIGNvbnN0IGRvbWFpbiA9IGlzRGV2ID8gJ2Rldi5icmlnaHRjaGFyZ2UubmV0JyA6ICdicmlnaHRjaGFyZ2UubmV0JztcblxuICAgIC8vIExvb2t1cCB0aGUgaG9zdGVkIHpvbmVcbiAgICBjb25zdCBob3N0ZWRab25lID0gcm91dGU1My5Ib3N0ZWRab25lLmZyb21Mb29rdXAodGhpcywgJ0JyaWdodENoYXJnZVpvbmUnLCB7XG4gICAgICBkb21haW5OYW1lOiAnYnJpZ2h0Y2hhcmdlLm5ldCcsXG4gICAgfSk7XG5cbiAgICAvLyBWUENcbiAgICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnQnJpZ2h0Q2hhcmdlVlBDJywge1xuICAgICAgbWF4QXpzOiAyLFxuICAgICAgbmF0R2F0ZXdheXM6IDEsXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnUHVibGljJyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ1ByaXZhdGUnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFNlY3VyaXR5IEdyb3VwIGZvciBFQzIgaW5zdGFuY2VzXG4gICAgY29uc3Qgd2ViU2VydmVyU0cgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ1dlYlNlcnZlclNHJywge1xuICAgICAgdnBjLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3Igd2ViIHNlcnZlcnMnLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIHdlYlNlcnZlclNHLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgICdBbGxvdyBIVFRQIHRyYWZmaWMnXG4gICAgKTtcblxuICAgIC8vIEF1dG8gU2NhbGluZyBHcm91cFxuICAgIGNvbnN0IGluc3RhbmNlVHlwZSA9IGlzRGV2ID8gZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UMywgZWMyLkluc3RhbmNlU2l6ZS5NSUNSTylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UMywgZWMyLkluc3RhbmNlU2l6ZS5TTUFMTCk7XG5cbiAgICBjb25zdCBhc2cgPSBuZXcgYXV0b3NjYWxpbmcuQXV0b1NjYWxpbmdHcm91cCh0aGlzLCAnQnJpZ2h0Q2hhcmdlQVNHJywge1xuICAgICAgdnBjLFxuICAgICAgdnBjU3VibmV0czogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTIH0sXG4gICAgICBpbnN0YW5jZVR5cGUsXG4gICAgICBtYWNoaW5lSW1hZ2U6IG5ldyBlYzIuQW1hem9uTGludXhJbWFnZSh7XG4gICAgICAgIGdlbmVyYXRpb246IGVjMi5BbWF6b25MaW51eEdlbmVyYXRpb24uQU1BWk9OX0xJTlVYXzIwMjMsXG4gICAgICB9KSxcbiAgICAgIG1pbkNhcGFjaXR5OiAxLFxuICAgICAgbWF4Q2FwYWNpdHk6IGlzRGV2ID8gMSA6IDMsXG4gICAgICBkZXNpcmVkQ2FwYWNpdHk6IDEsXG4gICAgICBzZWN1cml0eUdyb3VwOiB3ZWJTZXJ2ZXJTRyxcbiAgICAgIGhlYWx0aENoZWNrOiBhdXRvc2NhbGluZy5IZWFsdGhDaGVjay5lbGIoeyBncmFjZTogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApIH0pLFxuICAgIH0pO1xuXG4gICAgLy8gQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlclxuICAgIGNvbnN0IGFsYiA9IG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcih0aGlzLCAnQnJpZ2h0Q2hhcmdlQUxCJywge1xuICAgICAgdnBjLFxuICAgICAgaW50ZXJuZXRGYWNpbmc6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBDZXJ0aWZpY2F0ZSAoRE5TIHZhbGlkYXRpb24pXG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgYWNtLkNlcnRpZmljYXRlKHRoaXMsICdCcmlnaHRDaGFyZ2VDZXJ0Jywge1xuICAgICAgZG9tYWluTmFtZTogZG9tYWluLFxuICAgICAgdmFsaWRhdGlvbjogYWNtLkNlcnRpZmljYXRlVmFsaWRhdGlvbi5mcm9tRG5zKGhvc3RlZFpvbmUpLFxuICAgIH0pO1xuXG4gICAgLy8gQUxCIExpc3RlbmVyXG4gICAgY29uc3QgbGlzdGVuZXIgPSBhbGIuYWRkTGlzdGVuZXIoJ0h0dHBzTGlzdGVuZXInLCB7XG4gICAgICBwb3J0OiA0NDMsXG4gICAgICBjZXJ0aWZpY2F0ZXM6IFtjZXJ0aWZpY2F0ZV0sXG4gICAgICBwcm90b2NvbDogZWxidjIuQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQUyxcbiAgICB9KTtcblxuICAgIGxpc3RlbmVyLmFkZFRhcmdldHMoJ1dlYlRhcmdldCcsIHtcbiAgICAgIHBvcnQ6IDgwLFxuICAgICAgdGFyZ2V0czogW2FzZ10sXG4gICAgICBoZWFsdGhDaGVjazoge1xuICAgICAgICBwYXRoOiAnL2hlYWx0aCcsXG4gICAgICAgIHVuaGVhbHRoeVRocmVzaG9sZENvdW50OiAyLFxuICAgICAgICBoZWFsdGh5VGhyZXNob2xkQ291bnQ6IDUsXG4gICAgICAgIGludGVydmFsOiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICB9LFxuICAgICAgZGVyZWdpc3RyYXRpb25EZWxheTogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgIH0pO1xuXG4gICAgLy8gSFRUUCB0byBIVFRQUyByZWRpcmVjdFxuICAgIGFsYi5hZGRMaXN0ZW5lcignSHR0cExpc3RlbmVyJywge1xuICAgICAgcG9ydDogODAsXG4gICAgICBkZWZhdWx0QWN0aW9uOiBlbGJ2Mi5MaXN0ZW5lckFjdGlvbi5yZWRpcmVjdCh7XG4gICAgICAgIHByb3RvY29sOiAnSFRUUFMnLFxuICAgICAgICBwb3J0OiAnNDQzJyxcbiAgICAgICAgcGVybWFuZW50OiB0cnVlLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICAvLyBDbG91ZEZyb250IERpc3RyaWJ1dGlvblxuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnQnJpZ2h0Q2hhcmdlQ0ROJywge1xuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuTG9hZEJhbGFuY2VyVjJPcmlnaW4oYWxiKSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0FMTCxcbiAgICAgICAgY2FjaGVQb2xpY3k6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19ESVNBQkxFRCxcbiAgICAgIH0sXG4gICAgICBjZXJ0aWZpY2F0ZSxcbiAgICAgIGRvbWFpbk5hbWVzOiBbZG9tYWluXSxcbiAgICB9KTtcblxuICAgIC8vIFJvdXRlIDUzIEFsaWFzIFJlY29yZFxuICAgIG5ldyByb3V0ZTUzLkFSZWNvcmQodGhpcywgJ0JyaWdodENoYXJnZUFsaWFzUmVjb3JkJywge1xuICAgICAgem9uZTogaG9zdGVkWm9uZSxcbiAgICAgIHJlY29yZE5hbWU6IGlzRGV2ID8gJ2RldicgOiB1bmRlZmluZWQsXG4gICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhcbiAgICAgICAgbmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pXG4gICAgICApLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0IENsb3VkRnJvbnQgZG9tYWluIGFuZCBkaXN0cmlidXRpb24gSURcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2xvdWRGcm9udERvbWFpbicsIHtcbiAgICAgIHZhbHVlOiBkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gRG9tYWluIE5hbWUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rpc3RyaWJ1dGlvbklkJywge1xuICAgICAgdmFsdWU6IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gSUQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RvbWFpbk5hbWUnLCB7XG4gICAgICB2YWx1ZTogZG9tYWluLFxuICAgICAgZGVzY3JpcHRpb246ICdBcHBsaWNhdGlvbiBEb21haW4gTmFtZScsXG4gICAgfSk7XG4gIH1cbn0iXX0=