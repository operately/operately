echo "Exporting schema from operately_dev database..." 

PGPASSWORD=${DB_PASSWORD} pg_dump -h db -p 5432 -d operately_dev -U ${DB_USERNAME} -s -F p -E UTF-8 -f tmp/schema.sql

echo "Schema exported to: tmp/schema.sql"