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

::: warning Note
To Uninstall MetalLB
```bash
helm uninstall metallb --namespace kube-system
```
:::

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

::: warning Note
To Uninstall Nginx Ingress
```bash
helm uninstall nginx-ingress --namespace kube-system
```
:::

---

## Install cert-manager

Install the CustomResourceDefinition resources.
```bash
# kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v0.16.0/cert-manager.crds.yaml
```

cert-manager Helm charts aren't hosted by the official Helm hub, you need to configure a new repository named JetStack which maintains those charts
```bash
helm repo add jetstack https://charts.jetstack.io && helm repo update
```

Run the following command to install the cert-manager components under the kube-system namespace.
```bash
helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --version v1.3.1 --set installCRDs=true
```

Check that all three cert-manager components are running.
```bash
kubectl get pods -n cert-manager -l app.kubernetes.io/instance=cert-manager -o wide
```

::: warning Uninstalling
Before continuing, ensure that all cert-manager resources that have been created by users have been deleted
```bash
kubectl get Issuers,ClusterIssuers,Certificates,CertificateRequests,Orders,Challenges --all-namespaces
```
Once all these resources have been deleted you are ready to uninstall cert-manager.
```bash
helm uninstall cert-manager --namespace cert-manager
```
:::

In order to begin issuing certificates, you will need to set up a ClusterIssuer
or Issuer resource (for example, by creating a 'letsencrypt-staging' issuer).

We now going to configure two certificate issuers from which signed x509 certificates can be obtained, such as Let’s Encrypt:
* letsencrypt-staging: will be used for testing purpose only
* letsencrypt-prod: will be used for production purpose.
Run the following commands (change `<email>` by your email).
```yaml
# cluster-issuer-staging.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    # You must replace this email address with your own.
    # Let's Encrypt will use this to contact you about expiring
    # certificates, and issues related to your account.
    email: <email>
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      # Secret resource that will be used to store the account's private key.
      name: letsencrypt-staging
    # Add a single challenge solver, HTTP01 using nginx
    solvers:
    - http01:
        ingress:
          class: nginx
```
```bash
kubectl apply -f cluster-issuer-staging.yaml
```
```yaml
# cluster-issuer-prod.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: <email>
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```
```bash
kubectl apply -f cluster-issuer-prod.yaml
```
More information on the different types of issuers and how to configure them
can be found in our [documentation](https://cert-manager.io/docs/configuration/acme/#creating-a-basic-acme-issuer)

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
OR
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    # add an annotation indicating the issuer to use.
    cert-manager.io/cluster-issuer: "letsencrypt-staging"
  name: myIngress
  namespace: <namespace>
spec:
  tls: # < placing a host in the TLS config will determine what ends up in the cert's subjectAltNames
  - hosts:
    - <domain>
    secretName: "<domain>-staging-tls" # < cert-manager will store the created certificate in this secret.
  rules:
  - host: <domain>
    http:
      paths:
      - pathType: Prefix
        path: /
        backend:
          service:
            name: <service_name>
            port:
              number: 80
```
For information on how to configure cert-manager to automatically provision
Certificates for Ingress resources, take a look at the `ingress-shim`
[documentation](https://cert-manager.io/docs/usage/ingress/)
