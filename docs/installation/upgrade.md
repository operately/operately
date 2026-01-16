## General Upgrade Steps for Operately

This guide walks you through updating a self-hosted installation of Operately,
from any version to a newer version.

Before starting, log in to the server running Operately, and navigate to the
directory where Operately is running. By default this location is `~/operately`.

### Stop the Operately server

```
docker compose down
```

### Update the version

Edit the `docker-compose.yml` file and update the Operately version tag:

```
# From this:
image: operately/operately:vOLD

# To this:
image: operately/operately:vNEW
```

Replace `vOLD` with your current version and `vNEW` with the target version you
want to upgrade to.

Examples:

```
# From this:
image: operately/operately:1.2.0

# To this:
image: operately/operately:1.3.0
```

```
# From this:
image: operately/operately:1.2.0

# To this:
image: operately/operately:nightly-build-20260116-070020-49842cd04
```

### Run database migrations

```
docker compose run --rm app sh -c "/opt/operately/bin/migrate"
```

### Start the server

```
docker compose up --wait --detach
```
