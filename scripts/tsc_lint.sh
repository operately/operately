cd assets

MAX_ERRORS=3

errors=$(npx tsc --noEmit -p . | grep "error TS" | sed 's|^js/|assets/js/|' | tee /dev/tty | wc -l)

if [ $errors -gt $MAX_ERRORS ]; then
  echo "Found more than $MAX_ERRORS errors, (found $errors errors)"
  exit 1
else
  echo "Found $errors errors, which is less than or equal to the current limit $MAX_ERRORS"
fi
