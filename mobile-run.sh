#!/bin/bash

# Stop the script if any command fails
set -e

# Parse the --shard argument
SHARD=""
for arg in "$@"; do
  if [[ $arg == --shard=* ]]; then
    SHARD=${arg#*=}
  fi
done

# Download Base images
node images.mjs

# Run Mobile viewport UI visual regression comparisons
if [ -n "$SHARD" ]; then
  echo "Running mobile tests with shard $SHARD..."
  npm run test:mobile-run -- --shard=$SHARD
else
  echo "Running all mobile tests..."
  npm run test:mobile-run
fi