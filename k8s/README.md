# Kubernetes Installation

These files will allow you to use [Terraform](http://terraform.io) to deploy a [Kubernetes](http://kubernetes.io) cluster using [k3s](http://k3s.io), The certified Kubernetes distribution built for IoT & Edge computing!

The deployment will deploy k3s and the entire server-side of the Sprint/Equinix Metal drone IoT demo. When it is done, you will be able to visit `https://gateway.yourdomain.com/function/render-map` to view the demo.

## Install Terraform

Terraform is just a single binary.  Visit their [download page](https://www.terraform.io/downloads.html), choose your operating system, make the binary executable, and move it into your path.

Here is an example for **macOS**:
```bash
curl -LO https://releases.hashicorp.com/terraform/0.12.18/terraform_0.12.18_darwin_amd64.zip
unzip terraform_0.12.18_darwin_amd64.zip
chmod +x terraform
sudo mv terraform /usr/local/bin/
```

## Initialize Terraform

Terraform uses modules to deploy infrastructure. In order to initialize the modules your simply run: `terraform init`. This should download five modules into a hidden directory `.terraform`

## Modify your variables

This is set to run pretty well out of the box. You need to set are `auth_token` & `project_id` to connect to Equinix Metal. Both of these variables can be found in the Equinix Metal UI. You will also need to set the `domain_name` of the domain you are using to host the demo and an `email` to submit with your SSL certificate requests to the Let's Encrypt certificate authority.

The **auth token** can be found using the dropdown at the top right of the screen under `API Keys`. If you don't have one, you can create one by clicking `+ Add`.

The **project id** is a little more hidden. The best way to find this is by being logged into the Equinix Metal UI and be on the `SERVERS` section inside the project you want to deploy into. Then copy the UUID after `https://console.equinix.com/projects/` in the address bar.

The **node_count** defaults to 1 node, but should be set at at least 3-5 nodes for a production setup depending on the size of the dataset to be ingested.

Once you have collected your variables the easiest way to save them for future uses is by using the special `terraform.tfvars` file. You can create this by copy and pasting the following command, (Make sure you replace the `<auth_token>` and `<project_id>` in the command below):

```bash
cat <<EOF >terraform.tfvars
auth_token = "<auth_token>"
project_id = "<project_id>"
domain_name = "example.com"
email = "admin@example.com"
EOF
```

## Deploy the cluster

All there is left to do now is to deploy the cluster:
```bash
terraform apply --auto-approve
```
This should end with output similar to this:
```
Apply complete! Resources: 4 added, 0 changed, 0 destroyed.

Outputs:

Get_Access = ssh -i ssh_priv_key root@147.75.195.75
```

You can now login to the first node in the cluster by copy and pasting the ssh command from the output.

### Get `kubectl` access on your laptop

Start by [installing kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) on your local machine, which is more convenient than logging into the master each time.

Next install k3sup

```sh
curl -SLsf https://get.k3sup.dev | sudo sh
```

Now fetch the KUBECONFIG to the local directory:

```sh
export IP=147.75.195.75
k3sup install --ip $IP --user root \
  --skip-install \
  --context packet-iot \
  --ssh-key ./ssh_priv_key
```

`k3sup` will download an correctly configured KUBECONFIG file to your local directory. 

```sh
export KUBECONFIG=`pwd`/kubeconfig
kubectl get node -o wide
```

You can also merge the config to your local `~/.kube/config` file with:

```sh
export IP=147.75.195.75
k3sup install --ip $IP --user root \
  --skip-install \
  --ssh-key ./ssh_priv_key \
  --merge \
  --context packet-iot \
  --local-path $HOME/.kube/config
```

See the new context via:

```sh
kubectl config get-contexts

kubectl config set-contexts NAME
```

## Other Variables
| Variable Name | Default Value | Description |
| :-----------: |:------------: | :----------|
| auth_token | n/a | Equinix Metal API Key |
| project_id | n/a | Equinix Metal Project ID |
| hostname | k3s | The hostname for nodes |
| node_size | t1.small.x86| The size or type or flavor of the node |
| facility | ewr1 | The location or datacenter for the node |
| node_count | 1 | How many nodes to be in the k3s cluster |
| k3s_version | v1.0.0 | The GitHub release version of k3s to install |
| operating_system | ubuntu_16_04 | The Operating system of the node (Only Ubuntu 16.04 has been tested) |
| billing_cycle | hourly | How the node will be billed (Not usually changed) |
