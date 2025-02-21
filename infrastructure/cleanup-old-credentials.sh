#!/bin/bash
set -e

# Delete the specified access key
if [ -z "$1" ]; then
    echo "Usage: $0 <access-key-id>"
    echo "Please provide the access key ID to delete"
    exit 1
fi

OLD_ACCESS_KEY_ID="$1"

echo "Deleting access key $OLD_ACCESS_KEY_ID..."
aws iam delete-access-key \
    --access-key-id "$OLD_ACCESS_KEY_ID" \
    --user-name github-actions

echo "Old access key deleted successfully"