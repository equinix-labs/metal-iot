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
