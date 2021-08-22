# Argo CD GitOps

## Requirements
* Installed [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) command-line tool.
* Have a [kubeconfig](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/) file (default location is `~/.kube/config`).

## 1. Install Argo CD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```
This will create a new namespace, `argocd`, where Argo CD services and application resources will live.

## 2. Download Argo CD CLI
Download the latest Argo CD in Linux:
```bash
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd
```
More detailed installation instructions can be found via the [CLI installation documentation](cli_installation.md).

## 3. Access The Argo CD API Server
By default, the Argo CD API server is not exposed with an external IP. To access the API server,
choose one of the following techniques to expose the Argo CD API server:

### Service Type Load Balancer
Change the argocd-server service type to `LoadBalancer`:
```bash
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
```

### Ingress
Follow the [ingress documentation](operator-manual/ingress.md) on how to configure Argo CD with ingress.

### Port Forwarding
Kubectl port-forwarding can also be used to connect to the API server without exposing the service.

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
The API server can then be accessed using the localhost:8080

## 4. Login Using The CLI
The initial password for the `admin` account is auto-generated and stored as
clear text in the field `password` in a secret named `argocd-initial-admin-secret`
in your Argo CD installation namespace. You can simply retrieve this password
using `kubectl`:
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```
For better readability, e.g. if you want to copy & paste the generated password,
you can simply append `&& echo` to above command, which will add a newline to
the output.

!!! warning
    You should delete the `argocd-initial-admin-secret` from the Argo CD
    namespace once you changed the password. The secret serves no other
    purpose than to store the initially generated password in clear and can
    safely be deleted at any time. It will be re-created on demand by Argo CD
    if a new admin password must be re-generated.

Using the username `admin` and the password from above, login to Argo CD's IP or hostname:
```bash
argocd login <ARGOCD_SERVER>
```

Change the password using the command:
```bash
argocd account update-password
```

## 5. Register A Cluster To Deploy Apps To (Optional)
This step registers a cluster's credentials to Argo CD, and is only necessary when deploying to
an external cluster. When deploying internally (to the same cluster that Argo CD is running in),
https://kubernetes.default.svc should be used as the application's K8s API server address.

First list all clusters contexts in your current kubeconfig:
```bash
kubectl config get-contexts -o name
```
Choose a context name from the list and supply it to `argocd cluster add CONTEXTNAME`. For example,
for docker-desktop context, run:
```bash
argocd cluster add cluster-1
```
The above command installs a ServiceAccount (`argocd-manager`), into the kube-system namespace of 
that kubectl context, and binds the service account to an admin-level ClusterRole. Argo CD uses this
service account token to perform its management tasks (i.e. deploy/monitoring).

!!! note
    The rules of the `argocd-manager-role` role can be modified such that it only has `create`, `update`, `patch`, `delete` privileges to a limited set of namespaces, groups, kinds. 
    However `get`, `list`, `watch` privileges are required at the cluster-scope for Argo CD to function.

## 6. Install Argo CD Image Updater
The Argo CD Image Updater installation requires only one step. Install additional manifests into the existing Argo CD namespace:
```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/v0.9.0/manifests/install.yaml
```

## 7. Create Application
We need to create an Argo CD application and enable image management. The image updater is going to push changes into the Git repository so we need to create a repository that holds deployment manifests.

## 8. Create Access Token
Please navigate to https://github.com/settings/tokens/new and create a personal access token. Make sure to click “repo” checkbox to provide write access for the image updater. Use the generated token to configure repository credentials with the following command:
```bash
argocd repo add https://github.com/<username>/argocd-<app-name> — username updater — password <token>
```

## 9. Enable Image Management
Create an Argo CD application and enable automated image management.
```
export GH_USER=<username>
kubectl apply -n argocd -f — << EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: <app-name>
spec:
  destination:
    namespace: default
    server: https://kubernetes.default.svc
  project: default
  source:
    path: kustomize-<app-name>
    repoURL: https://github.com/$GH_USER/argocd-<app-name>.git
    targetRevision: master
  syncPolicy:
    automated: {}
EOF
```

## 10. Verify Application
As soon as the application is created, Argo CD is going to deploy application image into the default namespace. Use the kubectl to verify it or leverage Argo CD user interface to see the full resource’s hierarchy:
```bash
kubectl get deploy -o=wide -n default
```

## 11. Enable Image Management for the Application
The final step is to add annotations that enable automated image management for the application. Run the following command to add required annotations:
```bash
kubectl annotate app <APP_NAME> \
    argocd-image-updater.argoproj.io/image-list=<IMAGE_REPO_URL> \
    argocd-image-updater.argoproj.io/write-back-method=git
```

## 12. Check Application
The Image Updater checks applications every two minutes. Let’s wait a couple of minutes and check the deployment again:
```bash
kubectl get deploy -o=wide -n default
```
