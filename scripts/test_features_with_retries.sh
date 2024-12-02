#!/bin/bash

index=$1
total=$2

max_retries=5
failure_threshold=30

result=$(mix test $(find test -name "*_test.exs" | grep "test/features" | ./scripts/split.rb $index $total) | tee >(grep "[0-9]* failed, [0-9]* excluded, [0-9]* passed"))

failed_count=$(echo "$result" | awk '{print $1}')
failed_count=$((failed_count + 0)) # Convert to number

if [[ $failed_count -eq 0 ]]; then
  echo "All tests passed!"
  exit 0
fi

echo $result

if [[ $failed_count -ge $failure_threshold ]]; then
  exit 1
fi


for i in $(seq 1 $max_retries); do
  echo "Retrying failed tests..."

  result=$(mix test --failed | grep "failed, 0 excluded,")

  echo $result

  failed_count=$(echo "$result" | awk '{print $1}')
  failed_count=$((failed_count + 0)) 

  if [[ $failed_count -eq 0 ]]; then
    echo "All tests passed! (retry $i)"
    exit 0
  fi
done

echo "Reached maximum retries ($max_retries)."
echo $result
exit 1