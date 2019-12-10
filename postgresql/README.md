Install Helm:

https://helm.sh/docs/intro/install/

or

```
brew install helm
```

Install KubeDB:

https://kubedb.com/docs/v0.13.0-rc.0/setup/install/

The commands have changed slightly with Helm 3.x.

```
helm repo add appscode https://charts.appscode.com/stable/
helm repo update
helm install kubedb-operator appscode/kubedb --version v0.13.0-rc.0 \
  --namespace kube-system
helm install kubedb-catalog appscode/kubedb-catalog --version v0.13.0-rc.0 \
  --namespace kube-system
```

Install the KubeDB CLI:

https://kubedb.com/docs/v0.13.0-rc.0/setup/install/#install-kubedb-cli

Create PostgreSQL.

```
kubectl create ns iot
kubectl create -f postgresql.yaml
kubectl get pg -n iot postgres -o wide
```

See: https://kubedb.com/docs/v0.13.0-rc.0/guides/postgres/quickstart/quickstart/
