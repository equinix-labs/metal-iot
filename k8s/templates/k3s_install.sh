#!/bin/bash

node_num=${node_num}
master_ip="${master_ip}"
node_ip="${node_ip}"
k3s_ver="${k3s_ver}"

if [[ $node_num -eq 0 ]]; then
	curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=$k3s_ver sh -
else
  #sleep 30
  until [ -f /var/lib/rancher/k3s/server/node-token ]; do
    sleep 1
  done
  TOKEN=`cat /var/lib/rancher/k3s/server/node-token`
  URL="https://$master_ip:6443"
  ssh root@$node_ip <<-SSH
    curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=$k3s_ver K3S_URL=$URL K3S_TOKEN=$TOKEN sh -
SSH
fi
