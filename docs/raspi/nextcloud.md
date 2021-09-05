# Deploy NextCloud on Kubernetes

## Setup storage (PV & PVC)
1. Deploy the Persistent Volume (PV)
    ```yaml
    ## nextcloud.persistentvolume.yml
    apiVersion: v1
    kind: PersistentVolume
    metadata:
      name: "nextcloud-ssd"
      labels:
        type: "local"
    spec:
      storageClassName: "manual"
      capacity:
        storage: "50Gi"
      accessModes:
        - ReadWriteOnce
      hostPath:
        path: "/mnt/ssd/nextcloud"
    ```
2. Apply it to the k8 cluster
    ```bash
    kubectl apply -f nextcloud.persistentvolume.yml
    ```
3. Create the Persistent Volume Claim (PVC)
    ```yaml
    ## nextcloud.persistentvolumeclaim.yml
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      namespace: "nextcloud"
      name: "nextcloud-ssd"
    spec:
      storageClassName: "manual"
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: "50Gi"
    ```
4. Apply it to the k8 cluster
    ```bash
    kubectl apply -f nextcloud.persistentvolumeclaim.yml
    ```
5. Deploy the Persistent Volume
using `local` PV
```yaml
# nextcloud-db.persistentvolume.yml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nextcloud-db
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 8Gi
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
OR
using `hostPath` PV
```yaml
# nextcloud-db.persistentvolume.yml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nextcloud-db
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 8Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: "/mnt/ssd/nextcloud_db"
```
6. Apply it to the k8 cluster
```bash
kubectl apply -f nextcloud-db.persistentvolume.yml
```
7. Deploy the Persistent Volume Claim
```yaml
# nextcloud-db.persistentvolumeclaim.yml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  namespace: nextcloud
  name: nextcloud-db
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 8Gi
```
8. Apply it to the k8 cluster
```bash
kubectl apply -f nextcloud-db.persistentvolumeclaim.yml
```
9. Checkout the result
```bash
kubectl get pv
```

---

## Install the self-hosted Dropbox
1. Create a namespace, run the following command
    ```bash
    kubectl create namespace nextcloud
    ```
2. Download the Chart values of the chart locally
    ```bash
    helm show values stable/nextcloud >> nextcloud.values.yml
    ```
3. Update the values
    ```yaml
    ## nextcloud.values.yml
    nextcloud:
      host: "nextcloud.<domain.com>" # Host to reach NextCloud
      username: "admin" # Admin
      password: "<PASSWORD>" # Admin Password
    (...)
    mariadb:
      enabled: true
      db:
        name: nextcloud
        user: admin
        password: "<PASSWORD>"
      persistence:
        enabled: true
        existingClaim: "nextcloud-db"
        accessMode: ReadWriteOnce
        size: 8Gi
    redis:
      enabled: true
      usePassword: false
    (...)
    persistence:
      enabled: true # Change to true
      existingClaim: "nextcloud-ssd" # Persistent Volume Claim created earlier
      accessMode: ReadWriteOnce
      size: "50Gi"
    ```
4. Install the Chart
    ```bash
    helm install nextcloud stable/nextcloud \
     --namespace nextcloud \
     --values nextcloud.values.yml
    ```
5. Check the logs with the following command
    ```bash
    kubectl logs -f nextcloud-<POD_ID> -n nextcloud
    ```
    Otherwise check the folder `/mnt/ssd/nextcloud/data/nextcloud.log`.

::: info Upgrade Helm `nextcloud.values.yml`
```bash
helm upgrade -f nextcloud.values.yml nextcloud stable/nextcloud -n nextcloud
```
:::

::: warning Uninstalling the Chart
```bash
helm uninstall nextcloud --namespace nextcloud
```
:::

## Outside access
This step is configured before the ingress in order to be able to issue a certificate automatically when we deploy the ingress

1. Port Forwarding
    * First go to router setup and add a port-forwarding rule to map any incoming requests on port 80 or port 443 to be forwarded to 192.168.1.240 (the LoadBalancer IP of the Nginx).
2. Map the subdomain `nextcloud.<domain.com>` to the home router
    ```bash
    curl ipecho.net/plain
    # xxx.xxx.xxx.xxx
    ```
3. Configure the subdomain to make sure `nextcloud.<domain.com>` resolves to the external static IP. Go to domain provider console / DNS management add a record:
    * Type: A
    * Name: nextcloud (subdomain)
    * Value: xxx.xxx.xxx.xxx (external static IP)
4. Create the ingress config file `nextcloud.ingress.yml` containing:
```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  namespace: "nextcloud" # Same namespace as the deployment
  name: "nextcloud-ingress" # Name of the ingress (see kubectl get ingress -A)
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod" # Encrypt using the ClusterIssuer deployed while setting up Cert-Manager
    nginx.ingress.kubernetes.io/proxy-body-size:  "50m" # Increase the size of the maximum allowed size of the client request body
spec:
  tls:
  - hosts:
    - "nextcloud.<domain.com>" # Host to access nextcloud
    secretName: "nextcloud-prod-tls" # Name of the certifciate (see kubectl get certificate -A)
  rules:
  - host: "nextcloud.<domain.com>" # Host to access nextcloud
    http:
      paths:
        - path: /  # We will access NextCloud via the URL https://nextcloud.<domain.com>/
          backend:
            serviceName: "nextcloud" # Mapping to the service (see kubectl get services -n nextcloud)
            servicePort: 8080 # Mapping to the port (see kubectl get services -n nextcloud)
```
5. Deploy the Ingress
    ```bash
    kubectl apply -f nextcloud.ingress.yml
    ```
6. Check the certificate issuance
```bash
kubectl get certificaterequest -n nextcloud -o wide
kubectl get certificate -n nextcloud -o wide
```
