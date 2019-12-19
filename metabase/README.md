# Metabase installation.

You've already installed Helm when you added `k3sup`. Ensure that `helm` is in
your path.

```
export PATH=$PATH:$HOME/.k3sup/bin/
which helm
```

You can now install Metabase from the `stable` Helm repository.

```
helm repo add stable https://kubernetes-charts.storage.googleapis.com
helm repo update
helm install metabase stable/metabase --namespace openfaas
```

Install the Metabase ingress controller using Helm from this local repository.
Replace `<your domain>` below with your domain name, i.e. `example.com`.

```
helm install metabase-ingress ingress --set domain=<your domain> --namespace openfaas
```

You can now visit the `metabase` subdomain of your domain to view the Metabase
UI, i.e. `https://metabase.example.com`.

Alternatively, if you've not setup a domain name for the workshop, then you can
view the Metabase UI using Kubernetes port forwarding.

```
kubectl port-forward deploy/metabase-metabase -n openfaas 8083:80
```

Visit http://127.0.0.1:8082 to view Metabase.
