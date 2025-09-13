## Update Steps for Operately from version v0.4.0 to v1.0.0

This guide walks you through updating a self-hosted installation of Operately,
from version v0.4.0 to v1.0.0.

Before starting, log in to the server running Operately, and navigate to the
directory where operately is running. By default this location is `~/operately`.

### Stop the Operately server

```
docker compose down
```

### Update the version

Edit the `docker-compose.yml` file and update the Operately version:

```
# From this:
image: operately/operately:v0.4.0 

# To this:
image: operately/operately:v0.1.0
```

### Run database migrations

```
docker compose run --rm app sh -c "/app/bin/migrate"
```

### Start the server

```
docker compose up --wait --detach
```
