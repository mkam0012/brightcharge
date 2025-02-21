#!/bin/bash
set -e

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Create the IAM user
echo "Creating IAM user for BrightCharge deployments..."
aws iam create-user --user-name brightcharge-deployer

# Create and attach the policy
echo "Creating IAM policy..."
POLICY_ARN=$(aws iam create-policy \
    --policy-name BrightChargeDeploymentPolicy \
    --policy-document file://cdk-policy.json \
    --query 'Policy.Arn' \
    --output text)

echo "Attaching policy to user..."
aws iam attach-user-policy \
    --user-name brightcharge-deployer \
    --policy-arn "$POLICY_ARN"

# Create access key
echo "Creating access key..."
aws iam create-access-key \
    --user-name brightcharge-deployer \
    --query 'AccessKey.[AccessKeyId,SecretAccessKey]' \
    --output text > brightcharge-credentials.txt

echo "Credentials saved to brightcharge-credentials.txt"
echo "Please update your GitHub Actions secrets with these new credentials"
echo "and delete the old access key after confirming the new one works."