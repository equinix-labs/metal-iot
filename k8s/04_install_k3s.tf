data "template_file" "k3s_install_script" {
    count = length(packet_device.k3s_nodes)
    template = file("templates/k3s_install.sh")
    vars = {
        node_num = count.index
        master_ip = packet_device.k3s_nodes[0].access_public_ipv4
        node_ip = packet_device.k3s_nodes[count.index].access_public_ipv4
        k3s_ver = var.k3s_version
    }
}

resource "null_resource" "install_k3s" {
    count = length(packet_device.k3s_nodes)
    connection {
        type = "ssh"
        user = "root"
        private_key = chomp(tls_private_key.ssh_key.private_key_pem)
        host = packet_device.k3s_nodes[0].access_public_ipv4
    }

    provisioner "file" {
        content = data.template_file.k3s_install_script[count.index].rendered
        destination = format("/tmp/k3s_install_script_%d.sh", count.index)
    }
    provisioner "remote-exec" {
        inline = [
            format("chmod +x /tmp/k3s_install_script_%d.sh", count.index),
            format("/tmp/k3s_install_script_%d.sh", count.index)
        ]
    }
}

