# Cluster Monitoring

## Get the source code from Github

```bash
git clone https://github.com/carlosedp/cluster-monitoring.git
```

## Parameters that need to be configured in the `vars.jsonnet` file:
1. Set `modules.1.enabled` to `true`.
1. Set `k3s.enabled` to `true`.
2. Change your K3s master node IP(your VM or host IP) on `k3s.master_ip` parameter.
3. Edit `suffixDomain` to have your node IP with the `.nip.io` suffix or your cluster URL. This will be your ingress URL suffix.
4. Set traefikExporter `enabled` parameter to `true` to collect Traefik metrics and deploy dashboard.

## After changing these values to deploy the stack, run:
```bash
make vendor
make
```

## Some minor change on config files
1. Edit file at `manifests/kube-state-metrics-deployment.yaml`
2. Replace `spec.template.spec.containers.args.0.image` to `carlosedp/kube-state-metrics:v1.9.6-arm`
3. Edit file at `manifests/alertmanager-alertmanager.yaml`
4. Replace `spec.template.spec.image` to `prom/alertmanager:v0.22.2`
5. Edit file at `manifests/node-exporter-daemonset.yaml`
6. Replace `spec.template.spec.containers.args.0.image` to `prom/node-exporter-linux-arm64:v1.2.2`

## Deploy the manifests
```bash
kubectl apply -f manifests/setup/
# wait for it successful deployed
kubectl apply -f manifests/
```

## Get the URLs for the exposed applications and open in your browser
```bash
kubectl get ingress -n monitoring
```
Grafana default user: `admin` password: `admin`

## Uninstall
```bash
kubectl delete -f manifests/
kubectl delete -f manifests/setup/
```
