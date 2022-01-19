variable "auth_token" {
  description = "Equinix Metal API Key"
}

variable "project_id" {
  description = "Equinix Metal Project ID"
}

variable "email" {
  description = "E-mail address to use for certificate registration."
}

variable "domain_name" {
  description = "Domain name to use for SSL certificate generation."
}

variable "hostname" {
  description = "The hostname for nodes"
  default     = "k3s"
}

variable "node_size" {
  description = "The size or type or flavor of the node"
  default     = "t1.small.x86"
}

variable "facility" {
  description = "The location or datacenter for the node"
  default     = "ewr1"
}

variable "node_count" {
  description = "How many nodes to build"
  default     = 1
}

variable "k3s_version" {
  description = "The GitHub release version of k3s to install"
  default     = "v1.0.0"
}

variable "operating_system" {
  description = "The Operating system of the node (Only Ubuntu 16.04 has been tested)"
  default     = "ubuntu_16_04"
}

variable "billing_cycle" {
  description = "How the node will be billed (Not usually changed)"
  default     = "hourly"
}

variable "repo" {
  description = "GitHub repo to use for demo source."
  default     = "https://github.com/equinix-labs/metal-iot.git"
}

variable "branch" {
  description = "GitHub branch to use for demo source."
  default     = "master"
}

variable "docker_hub" {
  description = "Docker Hub user name from which to pull demo images."
  default     = "metaliotdemo"
}
