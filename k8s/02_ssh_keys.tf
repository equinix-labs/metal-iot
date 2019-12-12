resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits = 4096
}

<<<<<<< HEAD
=======

>>>>>>> 0a5fd6506e842fabdfdd352351f641f3c8cde0bb
resource "local_file" "priv_key" {
    content = chomp(tls_private_key.ssh_key.private_key_pem)
    filename = "ssh_priv_key"
    file_permission = "0600"
}

