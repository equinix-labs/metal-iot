# Equinix Labs IoT workshop

This workshop deploys compute, storage, networking, and an IoT application to metal.equinix.com.

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

> Note: This repository is designed to be used with your own domain name and a number of DNS records. This enables TLS termination (HTTPS) to be used for exposed services.

> You can register for a domain at [Google Domains](https://domains.google) or [Namecheap.com](https://namecheap.com) for a few dollars. You can also configure your domain there, after purchase.

### 1) Clone the repo

```sh
git clone https://github.com/equinix-labs/metal-iot
```

### 2) Create a bare-metal Kubernetes cluster and deploy the application

You will use [Terraform](https://www.terraform.io) to [create the cluster and deploy components](/k8s/).

Once deployed find the IP for one of the cluster nodes in terraform console output, your Equinix Metal dashboard or the `.tfstate` file in /k8s/. Create a wildcard DNS A record using this IP (replace `example.com` with your domain):

* `A *.example.com - <IP>`

### 3) Generate Drone Data

You can now send data to emitter from drone clients.  A [drone simulator](/test/client/) is included to generate realistic client data for use with visualization tools.  Be sure to configure the environment variables as decribed in the README.md - this will require `kubectl` to be properly configured from step 2.

### 4) Visualize the Drones in Realtime

A [MapBox](https://www.mapbox.com/) based web app is hosted in an OpenFAAS service and can be accessed via `gateway.<your domain>/function/render-map`.  It provides realtime information on the drone clients location and status.

![](/docs/images/map-render.png)

### 4) Visualize the Metrics

A [Grafana](https://grafana.com/) instance is included to monitor OpenFAAS performance and can be accesed at `grafana.<your domain>`.  The default login is username: `admin`, password: `admin`.

![](/docs/images/grafana.png)

A [Metabase](https://www.metabase.com/) instance is also hosted in the cluster at `metabase.<your domain>`.  When you first access Metabase you'll need to configure the instance to connect to the postgres DB.

The default config parameters are listed below.  Use kubectl to obtain the database password.

```sh
kubectl get secret --namespace default postgresql -o jsonpath="{.data.postgresql-password}" | base64 --decode
```

* Type of Database: `PostgreSQL`
* Name: `Drone Data`
* Host: `postgresql.default.svc.cluster.local`
* Port: `5432`
* Database name: `postgres`
* Database username: `postgres`
* Database password: `<password obtained from kubectl>`

Once connected to the database you can visualize the drone_event and drone_position tables.  The first image below shows the locations corresponding to each drone position update - note the drones are clustered in the delivery region surrounding a warehouse.  The second image shows the rate of battery consumption compared to the package payload size - note the abnormal battery to payload ratio for drones 0, 10, and 20 whic indicates the drones are running inefficiently compared to their peers.

![](/docs/images/metabase.png)
![](/docs/images/metabase2.png)


## Modifying the Project
This project is organized with each component having it's own self documented folder.  Feel free to explore how each is tied back to the [deploy script](/k8s/install). A few key components are:

* The [OpenFaaS services](/openfaas/services/) for processing events, storing data, and interfacing with drones.

* The [postgres](/postgresql/) database and [schema](/openfaas/services/schema.sql) 

* The [MQTT broker](/emitter/)

* The [Drone Monitor Service](/test/controller/)

>> Note that the README in most components assumes you have already created a Kubernetes cluster along with installing and configuring `kubectl` on your PC.
