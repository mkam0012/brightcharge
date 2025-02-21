#!/bin/bash
set -e

# Delete the old access key
OLD_ACCESS_KEY_ID="AKIA6JQ44OES2DI6OPZF"

echo "Deleting old access key..."
aws iam delete-access-key \
    --access-key-id "$OLD_ACCESS_KEY_ID" \
    --user-name github-actions

echo "Old access key deleted successfully"