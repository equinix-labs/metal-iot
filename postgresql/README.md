## Postgresql installation

Get `k3sup`, if you don't already have it:

```sh
curl -SLfs https://get.k3sup.dev | sudo sh
```

Install `postgresql` and copy down the instructions printed at the end with how to connect, and how to get your password.

```sh
k3sup app install postgresql
```

You'll see output like the following, feel free to test it out.

```sh
=======================================================================
= postgresql has been installed.                                      =
=======================================================================

PostgreSQL can be accessed via port 5432 on the following DNS name from within your cluster:

        postgresql.default.svc.cluster.local - Read/Write connection

To get the password for "postgres" run:

    export POSTGRES_PASSWORD=$(kubectl get secret --namespace default postgresql -o jsonpath="{.data.postgresql-password}" | base64 --decode)

To connect to your database run the following command:

    kubectl run postgresql-client --rm --tty -i --restart='Never' --namespace default --image docker.io/bitnami/postgresql:11.6.0-debian-9-r0 --env="PGPASSWORD=$POSTGRES_PASSWORD" --command -- psql --host postgresql -U postgres -d postgres -p 5432

To connect to your database from outside the cluster execute the following commands:

    kubectl port-forward --namespace default svc/postgresql 5432:5432 &
        PGPASSWORD="$POSTGRES_PASSWORD" psql --host 127.0.0.1 -U postgres -d postgres -p 5432

# Find out more at: https://github.com/helm/charts/tree/master/stable/postgresql
```
