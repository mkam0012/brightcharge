#!/bin/bash
set -e

# Install AWS CLI using apt
sudo apt-get update && sudo apt-get install -y awscli

# AWS CLI will be configured using GitHub Actions secrets
echo "AWS CLI installed successfully"