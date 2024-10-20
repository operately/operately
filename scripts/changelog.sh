#!/bin/bash

# Usage: ./changelog.sh --weeks-ago=[number]
#
# This script prints the commit history and closed issue history for the specified number of weeks ago.
# The output includes the commit date, hash, author, and message.
#
# The main usage of this script is to quickly see the commit history for a
# specific week in the past, while writting a release message.
#

for arg in "$@"; do
  case $arg in
    --weeks-ago=*)
      weeks_ago="${arg#*=}"
      shift # Remove the argument from processing
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

if [ -z "$weeks_ago" ]; then
    echo "Missing required argument: --weeks-ago=[number]"
    exit 1
fi

bash ./scripts/changelog/git-history.sh $weeks_ago
bash ./scripts/changelog/issue-history.sh $weeks_ago
