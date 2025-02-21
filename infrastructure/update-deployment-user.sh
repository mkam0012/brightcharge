#!/bin/bash
set -e

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Get the existing policy ARN
echo "Getting existing BrightCharge deployment policy..."
POLICY_ARN=$(aws iam list-policies \
    --scope Local \
    --query 'Policies[?starts_with(PolicyName, `BrightChargeDeploymentPolicy`)].Arn' \
    --output text | head -n 1)

if [ -z "$POLICY_ARN" ]; then
    echo "No existing BrightCharge deployment policy found. Creating new one..."
    POLICY_ARN=$(aws iam create-policy \
        --policy-name BrightChargeDeploymentPolicy-$(date +%Y%m%d) \
        --policy-document file://cdk-policy.json \
        --query 'Policy.Arn' \
        --output text)
fi

echo "Attaching policy to github-actions user..."
aws iam attach-user-policy \
    --user-name github-actions \
    --policy-arn "$POLICY_ARN"

# List current access keys
echo "Current access keys for github-actions user:"
aws iam list-access-keys --user-name github-actions

echo "Policy attached successfully to github-actions user"
echo "Review the access keys above and decide if you need to create a new one"
echo "To create a new access key, run: aws iam create-access-key --user-name github-actions"