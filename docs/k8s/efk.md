# Set Up EFK Stack in Kubernetes Cluster

## Requirements
* Kubernetes >= 1.14
* [Helm][] >= 2.17.0
* Minimum cluster requirements include the following to run this chart with
default settings. All of these settings are configurable.
  * Three Kubernetes nodes to respect the default "hard" affinity settings
  * 1GB of RAM for the JVM heap


## Install Kind
```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.9.0/kind-linux-amd64
chmod +x ./kind
# mv ./kind /[SOME_DIR_IN_YOUR_PATH]/kind
# eg.
mv ./kind /usr/bin/kind
```

## Create kind config file
### three node (two workers) cluster config
```bash
cat > kind-config.yaml <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
- role: worker
- role: worker
EOF
```

## Create cluster
```bash
kind create cluster --name k8s-playground --config kind-config.yaml
```

## Delete cluster
### To delete a specific cluster when done the testing
```bash
kind delete cluster --name k8s-playground
```

## Installing (EFK) Elastic, FluentD, Kibana
### Install released version using Helm repository
* Add the Elastic Helm charts repo:
```bash
helm repo add elastic https://helm.elastic.co
```
* Install it:
  - with Helm 3:
```bash
helm install elasticsearch elastic/elasticsearch -f values.yaml -n elastic
```
The reference for the [values.yaml](https://github.com/elastic/helm-charts/blob/master/elasticsearch/values.yaml)

### Install development version using master branch
* Clone the git repo: `git clone git@github.com:elastic/helm-charts.git`
* Install it:
  - with Helm 3: `helm install elasticsearch ./helm-charts/elasticsearch --set imageTag=8.0.0-SNAPSHOT`
  - with Helm 2 (deprecated): `helm install --name elasticsearch ./helm-charts/elasticsearch --set imageTag=8.0.0-SNAPSHOT`

## Install Kibana chart
```bash
helm install kibana elastic/kibana -n elastic
```

### Access Kibana locally
```bash
kubectl port-forward deployment/kibana-kibana 5601
access: localhost:5601
```

## Install nginx-ingress controller
```bash
helm repo add stable https://charts.helm.sh/stable
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginx-ingress ingress-nginx/ingress-nginx -n elastic
```

### An example Ingress that makes use of the controller:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
  name: kibana-ingress
  namespace: elastic
spec:
  rules:
    - host: kibana.local
      http:
        paths:
          - backend:
              service:
                name: kibana-kibana
                port:
                  number: 5601
            path: /
            pathType: Prefix
  # This section is only required if TLS is to be enabled for the Ingress
  tls:
      - hosts:
          - example.com
        secretName: example-tls
```

## If TLS is enabled for the Ingress, a Secret containing the certificate and key must also be provided:
```yaml
  apiVersion: v1
  kind: Secret
  metadata:
    name: kibana-tls
    namespace: elastic
  data:
    tls.crt: <base64 encoded cert>
    tls.key: <base64 encoded key>
  type: kubernetes.io/tls
```


## Install Fluentd
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install fluentd bitnami/fluentd -n elastic
```

### To verify that Fluentd has started, run:
```bash
kubectl get all -l "app.kubernetes.io/name=fluentd,app.kubernetes.io/instance=fluentd" -n elastic
```

Logs are captured on each node by the forwarder pods and then sent to the aggregator pods.
By default, the aggregator pods send the logs to the standard output.
### You can see all the logs by running this command:
```bash
kubectl logs -l "app.kubernetes.io/component=aggregator"
```

You can mount your own configuration files to the aggregators and the forwarders.
For example, this is useful if you want to forward the aggregated logs to Elasticsearch or another service.

### Restart Fluentd DeamonSet
```bash
kubectl rollout restart daemonset/fluentd
```

### Restart Elastic Search StatefulSet
```bash
kubectl rollout restart statefulset/elasticsearch-master
```


### Install Specific Helm version
```bash
helm install elasticsearch elastic/elasticsearch --version="7.9.0" -f values.yaml -n elastic
helm install kibana elastic/kibana --version="7.9.0" -n elastic
helm install fluentd bitnami/fluentd --version="2.0.1" -n elastic
helm install nginx-ingress ingress-nginx/ingress-nginx --version="2.15.0" -n elastic
```


## FAQ
#### Coordinating nodes
Every node is implicitly a coordinating node. This means that a node that has an
explicit empty list of roles will only act as a coordinating node.

When deploying coordinating-only node with Elasticsearch chart, it is required
to define the empty list of roles in both `roles` value and `node.roles`
settings:

```yaml
roles: []

esConfig:
  elasticsearch.yml: |
    node.roles: []
```

#### Basic example
Create the secret, the key name needs to be the keystore key path. In this
example we will create a secret from a file and from a literal string.
```
kubectl create secret generic encryption-key --from-file=xpack.watcher.encryption_key=./watcher_encryption_key
kubectl create secret generic slack-hook --from-literal=xpack.notification.slack.account.monitoring.secure_url='https://hooks.slack.com/services/asdasdasd/asdasdas/asdasd'
```
To add these secrets to the keystore:
```
keystore:
  - secretName: encryption-key
  - secretName: slack-hook
```

#### Multiple keys
All keys in the secret will be added to the keystore. To create the previous
example in one secret you could also do:
```
kubectl create secret generic keystore-secrets --from-file=xpack.watcher.encryption_key=./watcher_encryption_key --from-literal=xpack.notification.slack.account.monitoring.secure_url='https://hooks.slack.com/services/asdasdasd/asdasdas/asdasd'
```
```
keystore:
  - secretName: keystore-secrets
```
#### Custom paths and keys

If you are using these secrets for other applications (besides the Elasticsearch
keystore) then it is also possible to specify the keystore path and which keys
you want to add. Everything specified under each `keystore` item will be passed
through to the `volumeMounts` section for mounting the [secret][]. In this
example we will only add the `slack_hook` key from a secret that also has other
keys. Our secret looks like this:

```
kubectl create secret generic slack-secrets --from-literal=slack_channel='#general' --from-literal=slack_hook='https://hooks.slack.com/services/asdasdasd/asdasdas/asdasd'
```

We only want to add the `slack_hook` key to the keystore at path
`xpack.notification.slack.account.monitoring.secure_url`:

```
keystore:
  - secretName: slack-secrets
    items:
    - key: slack_hook
      path: xpack.notification.slack.account.monitoring.secure_url
```

You can also take a look at the [config example][] which is used as part of the
automated testing pipeline.

### How to enable snapshotting?
1. Install your [snapshot plugin][] into a custom Docker image following the
[how to install plugins guide][].
2. Add any required secrets or credentials into an Elasticsearch keystore
following the [how to use the keystore][] guide.
3. Configure the [snapshot repository][] as you normally would.
4. To automate snapshots you can use [Snapshot Lifecycle Management][] or a tool
like [curator][].

### How to configure templates post-deployment?

You can use `postStart` [lifecycle hooks][] to run code triggered after a
container is created.

Here is an example of `postStart` hook to configure templates:

```yaml
lifecycle:
  postStart:
    exec:
      command:
        - bash
        - -c
        - |
          #!/bin/bash
          # Add a template to adjust number of shards/replicas
          TEMPLATE_NAME=my_template
          INDEX_PATTERN="logstash-*"
          SHARD_COUNT=8
          REPLICA_COUNT=1
          ES_URL=http://localhost:9200
          while [[ "$(curl -s -o /dev/null -w '%{http_code}\n' $ES_URL)" != "200" ]]; do sleep 1; done
          curl -XPUT "$ES_URL/_template/$TEMPLATE_NAME" -H 'Content-Type: application/json' -d'{"index_patterns":['\""$INDEX_PATTERN"\"'],"settings":{"number_of_shards":'$SHARD_COUNT',"number_of_replicas":'$REPLICA_COUNT'}}'
```
