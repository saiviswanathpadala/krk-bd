#!/bin/bash

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Deploy Traefik
kubectl apply -f k8s/traefik.yaml

# Create ClusterIssuer
kubectl apply -f k8s/cluster-issuer.yaml

# Request certificate
kubectl apply -f k8s/certificate.yaml

