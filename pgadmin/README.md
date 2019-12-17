Installing PgAdmin.

This will create a deployment of PgAdmin you can use to view the tables in the
PostgresSQL database.

Install the PgAdmin service using Helm replacing example.com with the domain
name of your service.

```
helm install pgadmin ./ --set domain=example.com --namespace openfaas
```

Obtain the login password. The user name is admin.

```
echo $(kubectl --namespace openfaas get secrets pgadmin-password -o='jsonpath={.data.password}' | base64 -d)
```

You can now visit `http://pgadmin.example.com/` where `example.com` is the
domain you configured for this workshop. The user name is `admin`.

TK Instructions to connect PgAdmin to the demo chema.
