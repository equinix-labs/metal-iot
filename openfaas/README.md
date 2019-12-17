# OpenFaaS

## Introduction

OpenFaaS provides event-driven compute using functions and also supports traditional microservices.

![](https://github.com/openfaas/faas/raw/master/docs/of-layer-overview.png)

All services are either functions or microservices, which are built into Docker images. Once pushed to a Docker image, the CLI or REST can be used to deploy the endpoint. It will become available on the OpenFaaS gateway.

![](https://github.com/openfaas/faas/blob/master/docs/of-workflow.png?raw=true)

The Gateway can be accessed through its REST API, via the CLI or through the UI. All services or functions get a default route exposed, but custom domains can also be used for each endpoint. Prometheus collects metrics which are available via the Gateway's API and which are used for auto-scaling.

By changing the URL for a function from /function/NAME to /async-function/NAME an invocation can be run in a queue using NATS Streaming. You can also pass an optional callback URL via the header `X-Callback-Url`.

## Deployment

### Get the OpenFaaS CLI

> Run this command on your laptop

```sh
curl -sLS https://cli.openfaas.com | sh
chmod +x faas-cli
sudo mv faas-cli /usr/bin/
```

### Deploy OpenFaaS with helm3

> Run this command on your laptop

The `k3sup` binary installs OpenFaaS using helm3 and its chart:

* Get `k3sup` - for Mac, Windows or Linux

```sh
curl -sLS https://get.k3sup.dev | sh
sudo install k3sup /usr/bin/
```

* Deploy OpenFaaS

```sh
k3sup app install openfaas \
  --gateways 2 \
  --queue-workers 4
```

Follow the output at the end of the installation to test the deployment, do this from your laptop and not on the remote cluster.

```sh
kubectl rollout status -n openfaas deploy/gateway
kubectl port-forward -n openfaas svc/gateway 8080:8080 &

# If basic auth is enabled, you can now log into your gateway:
PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode; echo)
echo -n $PASSWORD | faas-cli login --username admin --password-stdin
```

Now deploy a function from the store and invoke it:

```sh
faas-cli store list
faas-cli store deploy nodeinfo

# Check for the Pod to become available ("Status: Ready")

faas-cli describe nodeinfo

echo verbose | faas-cli invoke nodeinfo
```

### Create your own function (optional)

> Run this command on your laptop

All functions need to be pushed to a registry, whether in-cluster, using a managed product or the Docker Hub.

If you want to follow this part of the lab, you'll need to [install Docker](https://docker.com/) on your laptop

The Docker Hub is the easiest option, for example:

```sh
export OPENFAAS_PREFIX="alexellis2"
docker login --username $OPENFAAS_PREFIX

# List available templates
faas-cli template store list

# Create a Node.js 12 async/await function:
faas-cli new --lang node12 db-inserter

# We can use one file for all the functions
mv db-inserter.yml stack.yml
```

This gives us:

```sh
├── db-inserter
│   ├── handler.js
│   └── package.json
└── stack.yml
```

Example of `handler.js`:

```js
"use strict"

module.exports = async (event, context) => {
    let err;
    const result =             {
        status: "Received input: " + JSON.stringify(event.body)
    };

    return context
        .status(200)
        .succeed(result);
}
```

Deploy:

```sh
# Build / push / deploy
faas-cli build
faas-cli push
faas-cli deploy

# Or all-in-one

faas-cli up
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
