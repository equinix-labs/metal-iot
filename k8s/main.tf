provider "metal" {
  auth_token = var.auth_token
}

resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "local_file" "priv_key" {
  content         = chomp(tls_private_key.ssh_key.private_key_pem)
  filename        = "ssh_priv_key"
  file_permission = "0600"
}

data "template_file" "user_data" {
  template = file("templates/user_data.sh")
  vars = {
    priv_key = chomp(tls_private_key.ssh_key.private_key_pem)
    pub_key  = chomp(tls_private_key.ssh_key.public_key_openssh)
  }
}

resource "metal_device" "k3s_nodes" {
  count            = var.node_count
  hostname         = format("%s-%02d", var.hostname, count.index + 1)
  plan             = var.node_size
  facilities       = [var.facility]
  operating_system = var.operating_system
  billing_cycle    = var.billing_cycle
  project_id       = var.project_id
  user_data        = data.template_file.user_data.rendered
}

data "template_file" "k3s_install_script" {
  count    = length(metal_device.k3s_nodes)
  template = file("templates/k3s_install.sh")
  vars = {
    node_num  = count.index
    master_ip = metal_device.k3s_nodes[0].access_public_ipv4
    node_ip   = metal_device.k3s_nodes[count.index].access_public_ipv4
    k3s_ver   = var.k3s_version
  }
}

data "template_file" "demo_install_script" {
  template = file("install_start")
  vars = {
    domain_name = base64encode(var.domain_name)
    repo        = base64encode(var.repo)
    branch      = base64encode(var.branch)
    email       = base64encode(var.email)
    docker_hub  = base64encode(var.docker_hub)
  }
}

resource "null_resource" "install_k3s" {
  count = length(metal_device.k3s_nodes)
  connection {
    type        = "ssh"
    user        = "root"
    private_key = chomp(tls_private_key.ssh_key.private_key_pem)
    host        = metal_device.k3s_nodes[0].access_public_ipv4
  }

  provisioner "file" {
    content     = data.template_file.k3s_install_script[count.index].rendered
    destination = format("/tmp/k3s_install_script_%d.sh", count.index)
  }
  provisioner "remote-exec" {
    inline = [
      format("chmod +x /tmp/k3s_install_script_%d.sh", count.index),
      format("/tmp/k3s_install_script_%d.sh", count.index)
    ]
  }
}

resource "null_resource" "install_demo" {
  triggers = {
    before = "x${join(",", null_resource.install_k3s[*].id)}"
  }
  connection {
    type        = "ssh"
    user        = "root"
    private_key = chomp(tls_private_key.ssh_key.private_key_pem)
    host        = metal_device.k3s_nodes[0].access_public_ipv4
  }
  provisioner "file" {
    source      = "install"
    destination = "/tmp/demo_install.sh"
  }
  provisioner "file" {
    content     = data.template_file.demo_install_script.rendered
    destination = "/tmp/demo_install_start.sh"
  }
  provisioner "remote-exec" {
    inline = [
      "bash /tmp/demo_install_start.sh"
    ]
  }
}
