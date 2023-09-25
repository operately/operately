#!/bin/bash

function on_error() {
  echo -e "\033[0;31m"
  echo "License check failed"
  echo -e "\033[0m"
  echo "To add a specific license to the whitelist, run:"
  echo "  bundle exec license_finder permitted_licenses add <LICENSE NAME> --decisions-file scripts/license_finder.yml"
  echo ""
  echo "To add a specific dependency to the whitelist, run:"
  echo "  bundle exec license_finder approvals add <DEPENDENCY NAME> --who <YOUR NAME> --why <REASON> --decisions-file scripts/license_finder.yml"
  echo ""
  echo "Before adding a dependency to the whitelist, please make sure that the license is compatible with the project's license and that the dependency is not a security risk."
  echo "Consult with the project's maintainers if you are unsure."
  echo ""
  exit 1
}

echo "CHECKING LICENSES FOR PROJECT ROOT"
bundle exec license_finder --project-path . --decisions-file scripts/license_finder.yml
if [ $? -ne 0 ]; then on_error; fi

echo "CHECKING LICENSES FOR ASSETS"
bundle exec license_finder --project-path assets --decisions-file scripts/license_finder.yml
if [ $? -ne 0 ]; then on_error; fi
