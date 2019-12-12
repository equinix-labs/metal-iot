# Kubernetes Installation
These files will allow you to use [Terraform](terraform.io) to deploy a [Kubernetes](kubernetes.io) cluster using [k3s](k3s.io), The certified Kubernetes distribution built for IoT & Edge computing!

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
This is set to run pretty well out of the box. The only two variables you need to set are: `auth_token` & `project_id`. Both of these variables can be found in the Packet UI.

The **auth token** can be found using the dropdown at the top right of the screen under `API Keys`. If you don't have one, you can create one by clicking `+ Add`.

The **project id** is a little more hidden. The best way to find this is by being logged into the Packet UI and be on the `SERVERS` section inside the project you want to deploy into. Then copy the UUID after `https://app.packet.net/projects/` in the address bar.

Once you have collected your variables the easiest way to save them for future uses is by using the special `override.tf` file. You can create this by copy and pasting the following command, (Make sure you replace the `<auth_token>` and `<project_id>` in the command below):
```bash
cat <<EOF >override.tf
variable "auth_token" {
    default = "<auth_token>"
}

variable "project_id" {
    default = "<project_id>"
}
EOF
```

#### Other Variables
| Variable Name | Default Value | Description |
| :-----------: |:------------: | :----------|
| auth_token | n/a | Packet API Key |
| project_id | n/a | Packet Project ID |
| hostname | k3s | The hostname for nodes |
| node_size | t1.small.x86| The size or type or flavor of the node |
| facility | ewr1 | The location or datacenter for the node |
| node_count | 1 | How many nodes to be in the k3s cluster |
| k3s_version | v1.0.0 | The GitHub release version of k3s to install |
| operating_system | ubuntu_16_04 | The Operating system of the node (Only Ubuntu 16.04 has been tested) |
| billing_cycle | hourly | How the node will be billed (Not usually changed) |

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

