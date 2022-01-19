![](https://img.shields.io/badge/Stability-Experimental-red.svg)

# Equinix Labs IoT workshop

This workshop deploys compute, storage, networking, and an IoT application to metal.equinix.com.

This repository is [Experimental](https://github.com/equinix-labs/equinix-labs/blob/main/experimental-statement.md) meaning that it's based on untested ideas or techniques and not yet established or finalized or involves a radically new and innovative style! This means that support is best effort (at best!) and we strongly encourage you to NOT use this in production.

## Conceptual architecture

Diagram:

![Conceptual architecture](/docs/images/conceptual.png)

Private components:

* Kubernetes - provisioned with [Terraform](https://www.terraform.io)
* TLS termination - via [cert-manager](https://cert-manager.io)
* MQTT Connector - [openfaas-incubator/mqtt-connector](https://github.com/openfaas-incubator/mqtt-connector)
* Database/storage - [Postgresql](https://www.postgresql.org)
* Docker registry - deployed externally, i.e. the Docker Hub.

Components exposed with TLS / Ingress or NodePort:

* Ingress Controller - [Traefik v1](https://github.com/containous/traefik) (HostPort 80/443)
* Serverless compute platform - [OpenFaaS](https://github.com/openfaas/faas)
* MQTT Broker - [emitter.io](https://emitter.io) (NodePort) - 30080/30443
* Business intelligence - [Metabase](https://www.metabase.com) (Ingress/TLS)
* Metrics visualization - [Grafana](https://grafana.com) (Ingress/TLS)

## Getting started

Before you begin using this repo you will need an [Equinix Metal](https://console.equinix.com) account.

Everything else you need to deploy this workshop is available in this repository.

> Note: This repository is designed to be used with your own domain name and a number of DNS records. This enables TLS termination (HTTPS) to be used for exposed services. If you are working in development, you can skip the domain and TLS steps. 

> You can register for a domain at [Google Domains](https://domains.google) or [Namecheap.com](https://namecheap.com) for a few dollars. You can also configure your domain there, after purchase.

### 1) Clone the repo

```sh
git clone https://github.com/equinix-labs/metal-iot
```

### 2) Create a bare-metal Kubernetes cluster

You will need to [install Terraform](https://www.terraform.io) for this step.

* Set your Equinix Metal API and project ID in a terraform.tfvar file in `/k8s`.

* Enter [the `k8s` folder](/k8s/) and apply the terraform plan.

* Find the IP of one of the nodes in the cluster from your Equinix Metal dashboard or the state file in /k8s/

Create four DNS A records (replace `example.com` with your domain):

* A `gateway.example.com` - IP
* A `grafana.example.com` - IP
* A `metabase.example.com` - IP
* A `emitter.example.com` - IP

Some commands will be run from your laptop, so make sure you install Kubectl

* [Install kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

### 3) Install Postgres via KubeDB and helm

You will need to install helm for this step.

* Install [postgresql](/postgresql/)

### 4) Install OpenFaaS

* Install [openfaas](/openfaas/) to provide compute and events

* Deploy the [OpenFaaS services](/openfaas/services/) for the application

You will also deploy the [schema.sql](/openfaas/services/schema.sql) at this time for `drone_position` and `drone_event`.

### 65 TLS for OpenFaaS

* Install cert-manager

    ```sh
    k3sup app install cert-manager
    ```

* Install an Ingress record for your OpenFaaS gateway

    ```sh
    k3sup app install openfaas-ingress \
    --domain gateway.example.com \
    --email openfaas@example.com \
    --ingress-class traefik
    ```

* Add TLS for Grafana

    Edit `./openfaas/grafana-ingress.yaml` and edit `grafana.example.com` replacing `example.com` with your domain.

    Now run:

    ```sh
    kubectl apply -f ./openfaas/grafana-ingress.yaml
    ```

### 6) Add the MQTT Broker (Emitter.io)

* Install [emitter](/emitter/)

### 7) Add the OpenFaaS MQTT-Connector

The MQTT-Connector is used to trigger functions and services in response to messages generated by the event source. It runs inside the Kubernetes cluster and is private with no ingress.

* Install [OpenFaaS MQTT-Connector](/openfaas/mqtt-connector/)

### 8) Add Grafana for function/service visualization

Grafana packages a pre-compiled dashboard for OpenFaaS to show metrics like throughput and latency.

* [Deploy and Grafana](/grafana/)

### 9) Send Drone Data

You can now send data to emitter from your drone clients.  Use the [drone simulator](/test/) to generate realistic data for use with visualization tools.
