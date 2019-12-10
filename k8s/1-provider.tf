terraform {
  required_version = ">= 0.12.2"
}

provider "packet" {
  version    = ">= 2.2.1"
  auth_token = var.auth_token
}

resource "packet_reserved_ip_block" "kubernetes" {
  project_id = var.project_id
  facility   = var.facility
  quantity   = 2
}

module "kube_token_1" {
  source = "git@github.com:packet-labs/packet-multiarch-k8s-terraform.git//modules/kube-token?ref=3c6ba8f2eb51922a081eb6f2d9689e27210b9e95"
}
