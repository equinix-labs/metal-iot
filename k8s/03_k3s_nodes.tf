provider "packet" {
  auth_token = var.auth_token
}

data "template_file" "user_data" {
    template = file("templates/user_data.sh")
    vars = {
        priv_key = chomp(tls_private_key.ssh_key.private_key_pem)
        pub_key = chomp(tls_private_key.ssh_key.public_key_openssh)
    }
}

resource "packet_device" "k3s_nodes" {
  count            = var.node_count
  hostname         = format("%s-%02d", var.hostname, count.index + 1)
  plan             = var.node_size
  facilities       = [var.facility]
  operating_system = var.operating_system
  billing_cycle    = var.billing_cycle
  project_id       = var.project_id
  user_data        = data.template_file.user_data.rendered
}

