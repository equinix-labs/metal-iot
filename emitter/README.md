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

Copy the new license into `broker.yaml` and start the broker and service.

For simplicity, the broker is deployed to the `openfaas` namespace.

```
kubectl apply -f broker.yaml
kubectl apply -f service.yaml
```

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
kubectl port-forward -n openfaas svc emitter 8080:8080 &
```

You can now use the IP address to access the Emitter UI. In the above example
you would go to `http://127.0.0.1:8080/keygen`. From there you can create
channel keys, which allow you to secure individual channels and start using
Emitter.

You can now proceed with the [Emitter documentation](https://github.com/emitter-io/emitter).
