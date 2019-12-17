## Emitter.io

[Emitter.io](https://emitter.io) is a MQTT broker with additional security provided via channel keys.

## Get started

First run Emitter in docker to generate a `EMITTER_LICENSE`. (Note that this is
not a software license key.)

```
docker run -d --name emitter -p 8080:8080 --restart=unless-stopped emitter/server
```

List the docker logs to see a randomly generated `EMITTER_LICENSE`.

```
docker logs emitter
2019/12/10 06:40:16 [service] unable to find a license, make sure 'license' value is set in the config file or EMITTER_LICENSE environment variable
2019/12/10 06:40:16 [license] generated new license: RfBEIAngTSCjWuEMrmsFe3qgYTWJiM7N9iZJsRtq8sjrD8OdGJ3QitnOkmzQXMWxFQ1o2nqdn5731Pe4s4PF1rME37CBnwYB:2
2019/12/10 06:40:16 [license] generated new secret key: aV3hzU01-SCF0wbnDdpXKCyxT4OB5Gad
```

* Create a Kubernetes secret to store the key

```sh
kubectl create secret generic emitter-secret -n openfaas --from-literal "secret=aV3hzU01-SCF0wbnDdpXKCyxT4OB5Gad"
```

## Edit `broker.yaml`

* Copy the new license into `broker.yaml` and start the broker and service.

## Deploy

For simplicity, the broker is deployed to the `openfaas` namespace.

```
kubectl apply -f broker.yaml
kubectl apply -f service.yaml
```

## Check the deployment

Check the logs of the service:

```
kubectl logs statefulset.apps/broker -n openfaas
```


You can now visit the `emitter` subdomain of your domain to view the Emitter
keygen UI, i.e. `https://emitter.example.com/keygen`.

Alternatively, if you've not setup a domain name for the workshop, then you can
view the Metabase UI using Kubernetes port forwarding.

```
export POD_NAME=$(kubectl get pods --namespace default -l "app=emitter,release=metabase" -o jsonpath="{.items[0].metadata.name}")
kubectl port-forward --namespace default $POD_NAME 8080:80
```

Visit http://127.0.0.1:8080/keygen to view the Emitter keygen UI.

## MQTT Endpoint

TK Certificate for termination?
