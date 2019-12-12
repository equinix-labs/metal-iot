variable "auth_token" {
  description = "Packet API Key"
}

variable "project_id" {
  description = "Packet Project ID"
}

variable "hostname" {
  description = "The hostname for nodes"
  default = "k3s"
}

variable "node_size" {
  description = "The size or type or flavor of the node"
  default = "t1.small.x86"
}

variable "facility" {
  description = "The location or datacenter for the node"
  default = "ewr1"
}

variable "node_count" {
  description = "How many nodes to build"
  default = 1
}

variable "k3s_version" {
  description = "The GitHub release version of k3s to install"
  default = "v1.0.0"
}

variable "operating_system" {
  description = "The Operating system of the node (Only Ubuntu 16.04 has been tested)"
  default = "ubuntu_16_04"
}

variable "billing_cycle" {
  description = "How the node will be billed (Not usually changed)"
  default = "hourly"
}

