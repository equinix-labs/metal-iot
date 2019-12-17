Metabase installation.

Install Metabase from the Helm `stable` repository using Helm.

```
helm repo add stable https://kubernetes-charts.storage.googleapis.com
helm repo update
helm install metabase stable/metabase
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
export POD_NAME=$(kubectl get pods --namespace default -l "app=metabase,release=metabase" -o jsonpath="{.items[0].metadata.name}")
kubectl port-forward --namespace default $POD_NAME 8080:3000
```

Visit http://127.0.0.1:8080 to view Metabase.
