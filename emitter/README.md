## Emitter.io

[Emitter.io](https://emitter.io) is a MQTT broker with additional security provided via channel keys.

## Get started

First run Emitter in docker to generate a `EMITTER_LICENSE`. (Note that this is
not a software license key.)

```sh
kubectl run --rm -i -t emitter --image=emitter/server:latest --restart=Never
```

Check the logs for a randomly generated `EMITTER_LICENSE`.

```sh
2019/12/16 17:56:04 [service] unable to find a license, make sure 'license' value is set in the config file or EMITTER_LICENSE environment variable
2019/12/16 17:56:04 [license] generated new license: RfBEIGQlQNSLQfIlm-b4s-TNJirEjMhJu7rGA5FJW8BTMFTTGADk2MX9Tq0AaT_20-of7cDM-clmRbb7Z-n5itgHubSCgwcB:2
2019/12/16 17:56:04 [license] generated new secret key: 2EXofPVkJJq7GEoQkFHN3B_P63Y4DoX_
```

* Create a Kubernetes secret to store the key

```sh
kubectl create secret generic emitter-secret -n openfaas --from-literal "secret=2EXofPVkJJq7GEoQkFHN3B_P63Y4DoX_" -o yaml --dry-run | kubectl apply -f -
```

## Edit `broker.yaml` and deploy

* Copy the new license into `broker.yaml`

* Update `replicas: 1` with the number of nodes, use "1" for the default

    For simplicity, the broker is deployed to the `openfaas` namespace.

    Run these commands:

    ```sh
    kubectl apply -f broker.yaml
    kubectl apply -f service.yaml
    ```

## Check the deployment

List the services to obtain the IP address of the Emitter load balancer.

```
 % kubectl --namespace openfaas get service emitter
 NAME      TYPE           CLUSTER-IP       EXTERNAL-IP     PORT(S) AGE
 emitter   ClusterIP   10.111.110.157    <pending>  8080:30790/TCP,8443:30705/TCP   8m40s
```

Check the logs of the service:

```
kubectl logs statefulset.apps/broker -n openfaas
```

Port-forward the Emitter's UI so that you can generate a channel key.

```sh
kubectl port-forward -n openfaas svc/emitter 8081:8080 &
```

You can now use the IP address to access the Emitter UI. In the above example
you would go to `http://127.0.0.1:8081/keygen`. From there you can create
channel keys, which allow you to secure individual channels and start using
Emitter.

You will need to enter the secret from above i.e. `aV3hzU01-SCF0wbnDdpXKCyxT4OB5Gad` or similar. If you can't remember the password, then look it up from the Kubernetes secret, and decode it with `kubectl get  secret/emitter-secret -o yaml -n openfaas` followed by `base64 -D` against the `secret` field.

* Navigate to `http://IP:port/keygen` where `IP` is the address of your Emitter.io deployment

* Generate a channel key for the `drone-position/` topic

![](/docs/images/keygen.png)

* Now  generate a second channel key for the `drone-event/` topic

![](/docs/images/keygen-2.png)


You'll need this key to configure the OpenFaaS Connector.
