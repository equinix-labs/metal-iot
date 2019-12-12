output "Get_Access" {
  value = format("ssh -i ssh_priv_key root@%s", packet_device.k3s_nodes[0].access_public_ipv4)
}
<<<<<<< HEAD

=======
>>>>>>> 0a5fd6506e842fabdfdd352351f641f3c8cde0bb
