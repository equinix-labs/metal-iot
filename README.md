# iot

IoT lab

## Getting started

1) Clone the repo

```sh

```

1) Apply Terraform

Remember to set your Packet API and project ID before running this step.

2) Install Postgres via KubeDB and helm

You will need to install helm for this step.

3) Install OpenFaaS

Follow [these instructions](/openfaas/)

4) Add the MQTT Broker (Emitter.io)

https://emitter.io

Generate a channel key via:

```
http://IP/keygen
```

You'll need this key to configure the OpenFaaS Connector

4) Add the OpenFaaS MQTT-Connector

```sh
git clone //github.com/openfaas-incubator/mqtt-connector
cd mqtt-connector
```

Edit `values.yaml` and add the CHANNEL_KEY value from the step above.

Follow the steps in README.md

TBD:

* Deploy business insights software
* Create OpenFaaS Function: insert row
* Create Postgesql schema asset
* Create OpenFaaS service for viewing data on mapbox
* Create OpenFaaS Function: Query drone positions for mapbox
 