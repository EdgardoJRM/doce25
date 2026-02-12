#!/bin/bash
export AWS_REGION=us-east-1
export FROM_EMAIL=info@doce25.org
export PUBLIC_BASE_URL=https://events.doce25.org
export COGNITO_ISSUER_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TEMP
export COGNITO_CLIENT_ID=temp-will-update

echo "=== Deploying Backend to Production ==="
npx serverless deploy --stage prod --verbose 2>&1 | tee ../../deployment/prod/backend-deploy.log
