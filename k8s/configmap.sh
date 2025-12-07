#!/bin/bash

# Create or update Frontend ConfigMap
# Using HTTP initially - will switch to HTTPS after Let's Encrypt certificate is obtained
echo "Creating/Updating ConfigMap: frontend-config"
echo "Backend API URL: http://stage1.kreddyking.com/api"
echo "Frontend URL: http://stage1.kreddyking.com"

kubectl create configmap frontend-config \
    --from-literal=API_BASE_URL="http://stage1.kreddyking.com/api" \
    --from-literal=FRONTEND_URL="http://stage1.kreddyking.com" \
    --dry-run=client -o yaml | kubectl apply -f -

# Create or update Backend ConfigMap
echo "Creating/Updating ConfigMap: backend-config"
echo "Frontend URL: http://stage1.kreddyking.com"
echo "Backend API URL: http://stage1.kreddyking.com/api"

kubectl create configmap backend-config \
    --from-literal=FRONTEND_URL="http://stage1.kreddyking.com" \
    --from-literal=API_BASE_URL="http://stage1.kreddyking.com/api" \
    --dry-run=client -o yaml | kubectl apply -f -
