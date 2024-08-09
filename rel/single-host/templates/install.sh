#/bin/bash

docker compose build --force

docker compose run --rm --user root app sh -c "chown -R nodody:root /certs"
docker compose run --rm --user root app sh -c "chown -R nodody:root /media"

docker compose run --rm app sh -c "/app/bin/create_db"
docker compose run --rm app sh -c "/app/bin/migrate"
