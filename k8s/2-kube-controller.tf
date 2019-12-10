module "controllers" {
  source = "git@github.com:packet-labs/packet-multiarch-k8s-terraform.git//modules/controller_pool?ref=3c6ba8f2eb51922a081eb6f2d9689e27210b9e95"

  kube_token               = module.kube_token_1.token
  kubernetes_version       = var.kubernetes_version
  count_x86                = var.count_x86
  count_gpu                = 0
  plan_primary             = var.plan_primary
  facility                 = var.facility
  cluster_name             = var.cluster_name
  kubernetes_lb_block      = packet_reserved_ip_block.kubernetes.cidr_notation
  project_id               = var.project_id
  auth_token               = var.auth_token
  secrets_encryption       = var.secrets_encryption
  configure_ingress        = var.configure_ingress
  storage                  = var.storage
  configure_network        = var.configure_network
  skip_workloads           = var.skip_workloads
  network                  = var.network
  control_plane_node_count = var.control_plane_node_count
  ssh_private_key_path     = var.ssh_private_key_path
}
