output "Get_Access" {
  value = format("ssh -i ssh_priv_key root@%s", metal_device.k3s_nodes[0].access_public_ipv4)
}

