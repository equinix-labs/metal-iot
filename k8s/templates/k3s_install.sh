#!/bin/bash

node_num=${node_num}
master_ip="${master_ip}"
node_ip="${node_ip}"
k3s_ver="${k3s_ver}"

<<<<<<< HEAD
# If we are the fist node install k3s
if [[ $node_num -eq 0 ]]; then
	curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=$k3s_ver sh -
else
# If we are not the first node wait for k3s to be installed on the first node then install k3s
=======
if [[ $node_num -eq 0 ]]; then
	curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=$k3s_ver sh -
else
  #sleep 30
>>>>>>> 0a5fd6506e842fabdfdd352351f641f3c8cde0bb
  until [ -f /var/lib/rancher/k3s/server/node-token ]; do
    sleep 1
  done
  TOKEN=`cat /var/lib/rancher/k3s/server/node-token`
  URL="https://$master_ip:6443"
  ssh root@$node_ip <<-SSH
    curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=$k3s_ver K3S_URL=$URL K3S_TOKEN=$TOKEN sh -
SSH
fi
<<<<<<< HEAD

=======
>>>>>>> 0a5fd6506e842fabdfdd352351f641f3c8cde0bb
