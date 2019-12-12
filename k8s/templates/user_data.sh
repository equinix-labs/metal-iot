#!/bin/bash
priv_key='${priv_key}'
pub_key='${pub_key}'

# Create Private Key
cat <<EOF >/root/.ssh/id_rsa
$priv_key
EOF
chmod 0400 /root/.ssh/id_rsa

# Add Public Key
echo $pub_key >> /root/.ssh/authorized_keys

# Don't prompt for ssh fingerprint
cat <<EOF >/root/.ssh/config
Host *
    StrictHostKeyChecking no
EOF
chmod 0400 /root/.ssh/config
<<<<<<< HEAD

=======
>>>>>>> 0a5fd6506e842fabdfdd352351f641f3c8cde0bb
