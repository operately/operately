cd assets

MAX_ERRORS=120

errors=$(npx tsc --noEmit -p . | grep "error TS" | tee /dev/tty | wc -l)

if [ $errors -gt $MAX_ERRORS ]; then
  echo "Found more than $MAX_ERRORS errors"
  exit 1
fi
