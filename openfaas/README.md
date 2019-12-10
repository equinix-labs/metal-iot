# OpenFaaS

## Introduction

OpenFaaS provides event-driven compute using functions and also supports traditional microservices.

![](https://github.com/openfaas/faas/raw/master/docs/of-layer-overview.png)

All services are either functions or microservices, which are built into Docker images. Once pushed to a Docker image, the CLI or REST can be used to deploy the endpoint. It will become available on the OpenFaaS gateway.

![](https://github.com/openfaas/faas/blob/master/docs/of-workflow.png?raw=true)

The Gateway can be accessed through its REST API, via the CLI or through the UI. All services or functions get a default route exposed, but custom domains can also be used for each endpoint. Prometheus collects metrics which are available via the Gateway's API and which are used for auto-scaling.

By changing the URL for a function from /function/NAME to /async-function/NAME an invocation can be run in a queue using NATS Streaming. You can also pass an optional callback URL via the header `X-Callback-Url`.

## Deployment

### Deploy OpenFaaS with helm3

The `k3sup` binary installs OpenFaaS using helm3 and its chart:

* Get `k3sup` - for Mac, Windows or Linux

```sh
curl -sLS https://get.k3sup.dev | sh
sudo install k3sup /usr/bin/
```

* Deploy OpenFaaS with a LoadBalancer

Since the Packet Labs configuration deploys MetalLB, we can create deploy OpenFaaS and expose a LoadBalancer service for the OpenFaaS gateway:

```sh
k3sup app install openfaas --load-balancer
```

Follow the output at the end of the installation to test the deployment.

```sh
kubectl rollout status -n openfaas deploy/gateway
kubectl port-forward -n openfaas svc/gateway 8080:8080 &

# If basic auth is enabled, you can now log into your gateway:
PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode; echo)
echo -n $PASSWORD | faas-cli login --username admin --password-stdin


faas-cli store list
faas-cli store deploy nodeinfo

# Check for the Pod to become available ("Status: Ready")

faas-cli describe nodeinfo

echo verbose | faas-cli invoke nodeinfo
```

Now obtain your public endpoint for the OpenFaaS gateway, look for the EXTERNAL-IP:

```sh
kubectl get svc -n openfaas

NAME                TYPE           CLUSTER-IP       EXTERNAL-IP                                                               PORT(S)          AGE
gateway-external    LoadBalancer   10.100.71.191    172.217.14.165   8080:31079/TCP   10m
```

This corresponds to the LoadBalancer created by the helm chart.

### Get the OpenFaaS CLI

```sh
curl -sLS https://cli.openfaas.com | sh
chmod +x faas-cli
sudo mv faas-cli /usr/bin/
```

### Create your own function

All functions need to be pushed to a registry, whether in-cluster, using a managed product or the Docker Hub.

The Docker Hub is the easiest option, for example:

```sh
export OPENFAAS_PREFIX="alexellis2"
docker login --username alexellis2

# List available templates
faas-cli template store list

# Create a Node.js 12 async/await function:
faas-cli new --lang node12 db-inserter

# Build / push / deploy
faas-cli build -f db-insert.yaml
faas-cli push -f db-insert.yaml
faas-cli deploy -f db-insert.yaml

# Or all-in-one

faas-cli up -f db-insert.yaml
```

View the function on the OpenFaaS UI or invoke via `faas-cli invoke db-insert`.

## Technical support

Seek out technical support on the [OpenFaaS Slack](https://slack.openfaas.io/)

## Take it further

Hands-on training:

* [OpenFaaS blog](https://www.openfaas.com/blog/)
* [Official Workshop](https://github.com/openfaas/workshop)
* [Apply TLS with cert-manager](https://blog.alexellis.io/tls-the-easy-way-with-openfaas-and-k3sup/)

Reference:

* [Event triggers](https://docs.openfaas.com/reference/triggers/)
* [MQTT Connector](https://github.com/openfaas-incubator/mqtt-connector)

* [Async / queueing](https://docs.openfaas.com/reference/async/)
* [Secret management](https://docs.openfaas.com/reference/secrets/)
