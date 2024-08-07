git fetch --tags

latest=$(git tag | sort --version-sort | tail -n 1)

if [ -z "$latest" ]; then
  echo "v0.0.1"
  exit 0
fi

case $1 in
  Major)
    next=$(echo $latest | cut -c 2- | awk -F '.' '{ print "v" $1+1 ".0.0" }')
    echo $next
    ;;
  Minor)
    next=$(echo $latest | cut -c 2- | awk -F '.' '{ print "v" $1 "." $2 + 1 ".0" }')
    echo $next
    ;;
  Patch)
    next=$(echo $latest | cut -c 2- | awk -F '.' '{ print "v" $1 "." $2 "." $3+1 }')
    echo $next
    ;;
  *)
    echo "Invalid release type: $RELEASE_TYPE"
    exit 1
    ;;
esac
