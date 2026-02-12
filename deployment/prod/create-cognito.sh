#!/bin/bash
echo "=== Creating Cognito User Pool ==="

# Create User Pool
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name doce25-events-prod \
  --auto-verified-attributes email \
  --username-attributes email \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}" \
  --region us-east-1 \
  --query 'UserPool.Id' \
  --output text)

echo "User Pool ID: $USER_POOL_ID"
echo "USER_POOL_ID=$USER_POOL_ID" > deployment/prod/cognito-ids.txt

# Create User Pool Client
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name doce25-events-client-prod \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
  --generate-secret false \
  --region us-east-1 \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "Client ID: $CLIENT_ID"
echo "CLIENT_ID=$CLIENT_ID" >> deployment/prod/cognito-ids.txt

# Create admin group
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name admin \
  --description "Administrators" \
  --region us-east-1

# Create staff group
aws cognito-idp create-group \
  --user-pool-id $USER_POOL_ID \
  --group-name staff \
  --description "Staff members" \
  --region us-east-1

# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@doce25.org \
  --user-attributes Name=email,Value=admin@doce25.org Name=email_verified,Value=true \
  --temporary-password Doce25Admin2025! \
  --message-action SUPPRESS \
  --region us-east-1

# Add to admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@doce25.org \
  --group-name admin \
  --region us-east-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username admin@doce25.org \
  --password Doce25Admin2025! \
  --permanent \
  --region us-east-1

echo ""
echo "=== Cognito Setup Complete ==="
echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"
echo "Issuer URL: https://cognito-idp.us-east-1.amazonaws.com/$USER_POOL_ID"
echo ""
echo "Admin User: admin@doce25.org"
echo "Password: Doce25Admin2025!"
echo ""
echo "Saved to: deployment/prod/cognito-ids.txt"
