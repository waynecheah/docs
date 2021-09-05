# Cluster Monitoring

## Prerequisite
Install Golang on the machine that runs `kubectl`
```bash
sudo apt install golang-go
export PATH=$PATH:$(go env GOPATH)/bin
export GOPATH=$(go env GOPATH)
```

## Get the source code from Github

```bash
git clone https://github.com/carlosedp/cluster-monitoring.git
```

## Parameters that need to be configured in the `vars.jsonnet` file:
1. Set `modules.1.enabled` to `true`.
2. Set `k3s.enabled` to `true`.
3. Change your K3s master node IP (your VM or host IP) on `k3s.master_ip` parameter.
4. Edit `suffixDomain` to have your node IP with the `.nip.io` suffix or your cluster URL. This will be your ingress URL suffix.
5. Enable the persistence to store the metrics `Prometheus` and dashboard settings `Grafana` edit following:
   * `enablePersistence.prometheus` to `true`
   * `enablePersistence.grafana` to `true`
   * `enablePersistence.storageClass` to `manual`
6. Edit `grafana.from_address` to your `email` address

::: info suffixDomain
The suffix domain is used to deploy an ingress to access Prometheus `prometheus.<suffixDomain>` 
and Grafana `grafana.<suffixDomain>`. You can manually configure a DNS entry to point to 
192.168.1.240 (Load Balancer IP of the Nginx) or used nip.io to automatically resolve a domain to 
an IP (basically it resolves `<anything>.<ip>.nip.io` by `<ip>` without requiring any other configuration).
:::

Example:
```js
modules: [
  {
    name: '...',
    enabled: false,
    file: '...'
  },
  {
    name: 'armExporter',
    enabled: true,
    file: import 'modules/arm_exporter.jsonnet'
  },
  // ...
],

k3s: {
  enabled: true,
  master_ip: ['192.168.1.22']
},

suffixDomain: '192.168.1.240.nip.io',

enablePersistence: {
  prometheus: true,
  grafana: true,
  storageClass: 'manual',
  // ...
},

grafana: {
  from_address: 'cheahkokweng@gmail.com',
  // ...
}
```

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

Once deployed, check that the namespace `monitoring` has all the components up and running.
```bash
kubectl get pods -n monitoring -o wide
```

## Get the URLs for the exposed applications and open in your browser
```bash
kubectl get ingress -n monitoring
```

## Dashboard
After configuring and deploying our Kubernetes Monitoring stack, you can now access the different components:
* Prometheus: [https://prometheus.192.168.1.240.nip.io](https://prometheus.192.168.1.240.nip.io)
* Grafana: [https://grafana.192.168.1.240.nip.io](https://grafana.192.168.1.240.nip.io)

Click on the Grafana link and login with the Grafana default user: `admin` password: `admin`
(you will be asked to choose a new password)

::: warning Uninstall
```bash
kubectl delete -f manifests/
kubectl delete -f manifests/setup/
```
:::
