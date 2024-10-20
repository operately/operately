weeks_ago=$1

start_date=$(date -d "monday $weeks_ago week ago")
end_date=$(date -d "monday $((weeks_ago - 1)) week ago")

start_date=$(date -d "$start_date" +%Y-%m-%d)
end_date=$(date -d "$end_date" +%Y-%m-%d)

gh pr list --repo operately/operately \
  --limit 100 \
  --state closed \
  --search "is:merged sort:closed-at closed:$start_date..$end_date"
