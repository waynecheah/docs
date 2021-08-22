# Install and configure a Kubernetes cluster with k3s to self-host applications

## Install Helm (version >= 3.x.y) - Kubernetes Package Manager

1. Install Helm command line tools on your local machine
   ```bash
   curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
   ```
2. Check the version
   ```bash
   helm version
   ```
3. Add the repository for official charts
   ```bash
   helm repo add "stable" "https://charts.helm.sh/stable"
   ```

---

## Install MetalLB - Kubernetes Load Balancer

Create `values.yaml` configuration file
```yaml
configInline:
  address-pools:
  - name: default
    protocol: layer2
    addresses:
    - 192.168.1.240-192.168.1.250
```

```bash
helm install metallb -f values.yaml stable/metallb --namespace kube-system
# helm install metallb -f values.yaml bitnami/metallb --namespace kube-system # not support ARM now
```

After a few seconds, you should observe the MetalLB components deployed under `kube-system` namespace.
```bash
kubectl get pods -n kube-system -l app=metallb -o wide
```

### Uninstall MetalLB
```bash
helm uninstall metallb --namespace kube-system
```

---

## Install Nginx - Web Proxy

```bash
helm install nginx-ingress stable/nginx-ingress --namespace kube-system --set defaultBackend.enabled=false
```
OR
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx && \
helm repo update && \
helm install nginx-ingress ingress-nginx/ingress-nginx --namespace kube-system \
 --set controller.image.repository=willdockerhub/ingress-nginx-controller:v1.0.0-beta.1 \
OR
 --set controller.image.registry=docker.io \
 --set controller.image.image=willdockerhub/ingress-nginx-controller \
 --set controller.image.tag v1.0.0-beta.1 \
 --set defaultBackend.enabled=false
```

After a few seconds, you should observe the Nginx component deployed under `kube-system` namespace.
```bash
kubectl get pods -n kube-system -l app=nginx-ingress -o wide
```

An example Ingress that makes use of the controller:
```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: example
  namespace: foo
spec:
  rules:
    - host: www.example.com
      http:
        paths:
          - backend:
              serviceName: exampleService
              servicePort: 80
            path: /
  # This section is only required if TLS is to be enabled for the Ingress
  tls:
      - hosts:
          - www.example.com
        secretName: example-tls
```
If TLS is enabled for the Ingress, a Secret containing the certificate and key must also be provided:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: example-tls
  namespace: foo
data:
  tls.crt: <base64 encoded cert>
  tls.key: <base64 encoded key>
type: kubernetes.io/tls
```

---

## Install cert-manager

Install the CustomResourceDefinition resources.
```bash
kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v0.16.0/cert-manager.crds.yaml
```

cert-manager Helm charts aren't hosted by the offical Helm hub, you need to configure a new repository named JetStack which maintains those charts
```bash
helm repo add jetstack https://charts.jetstack.io && helm repo update
```

Run the following command to install the cert-manager components under the kube-system namespace.
```bash
helm install cert-manager jetstack/cert-manager --namespace kube-system --version v0.16.0
```

Check that all three cert-manager components are running.
```bash
kubectl get pods -n kube-system -l app.kubernetes.io/instance=cert-manager -o wide
```

We now going to configure two certificate issuers from which signed x509 certificates can be obtained, such as Let’s Encrypt:
* letsencrypt-staging: will be used for testing purpose only
* letsencrypt-prod: will be used for production purpose.
Run the following commands (change `<EMAIL>` by your email).
```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1alpha2
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    email: <EMAIL>
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1alpha2
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: <EMAIL>
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

Once done, we should be able to automatically issue a Let's Encrypt's certificate every time we configure an ingress with ssl.

The following k8s config file allows to access the service service_name (`port 80`) from outside the cluster with issuance of a certificate to the domain domain.
```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-staging"
spec:
  tls:
  - hosts:
    - <domain>
    secretName: "<domain>-staging-tls"
  rules:
  - host: <domain>
    http:
      paths:
        - path: /
          backend:
            serviceName: <service_name>
            servicePort: 80
```

### Uninstall cert-manager
```bash
helm uninstall cert-manager --namespace kube-system
```

---

## Manage storage

Deploy the Persistent Volume
```yaml
# persistentvolume.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv
  labels:
    type: local
spec:
  storageClassName: local-storage
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  local:
    path: "/mnt/disks"
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - <node_name>

```

```bash
kubectl apply -f persistentvolume.yaml
```

Deploy the Persistent Volume Claim
```yaml
# persistentvolumeclaim.yaml
apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: my-volume
  spec:
    storageClassName: local-storage
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: 1Gi
```

```bash
kubectl apply -f persistentvolumeclaim.yaml
```

Checkout the result
```bash
kubectl get pv
```
