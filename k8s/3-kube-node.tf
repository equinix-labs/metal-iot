module "node_pool_blue" {
  source = "git@github.com:packet-labs/packet-multiarch-k8s-terraform.git//modules/node_pool?ref=3c6ba8f2eb51922a081eb6f2d9689e27210b9e95"

  kube_token         = module.kube_token_1.token
  kubernetes_version = var.kubernetes_version
  pool_label         = "blue"
  count_x86          = var.count_x86
  count_arm          = var.count_arm
  plan_x86           = var.plan_x86
  plan_arm           = var.plan_arm
  facility           = var.facility
  cluster_name       = var.cluster_name
  controller_address = module.controllers.controller_addresses
  project_id         = var.project_id
  storage            = var.storage
}
