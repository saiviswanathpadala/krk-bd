# Traefik SSL Certificate Setup

This setup uses Traefik only for SSL certificate generation via Let's Encrypt, while keeping your frontend service as LoadBalancer.

## Installation Steps

### 1. Update email and domain
- Edit `k8s/cluster-issuer.yaml` - replace `your-email@example.com` with your email
- Edit `k8s/certificate.yaml` - update domain if different from `stage1.kreddyking.com`

### 2. Run installation
```bash
bash k8s/install-traefik-ssl.sh
```

Or manually:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
kubectl apply -f k8s/traefik.yaml
kubectl apply -f k8s/cluster-issuer.yaml
kubectl apply -f k8s/certificate.yaml
```

### 5. Verify certificate generation
```bash
# Check certificate status
kubectl get certificate

# Check certificate details
kubectl describe certificate frontend-tls

# Verify the secret was created
kubectl get secret frontend-tls
```

## How It Works

1. **Traefik** - Handles HTTP-01 challenge requests from Let's Encrypt
2. **ClusterIssuer** - Configures cert-manager to use Let's Encrypt
3. **Certificate** - Requests SSL certificate for your domain (cert-manager auto-creates challenge ingress)
4. **Secret** - Stores the generated certificate (frontend-tls)

## Using the Certificate

The certificate is stored in the `frontend-tls` secret. You can:
- Mount it in your nginx container
- Use it with your LoadBalancer (if supported by your cloud provider)
- Reference it in other ingresses

## Notes

- Your frontend service remains as LoadBalancer (no changes needed)
- Traefik only handles SSL certificate generation, not routing
- Certificates auto-renew every 60 days
- cert-manager automatically creates temporary ingress for Let's Encrypt validation

