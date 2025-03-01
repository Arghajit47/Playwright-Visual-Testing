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

# Run Desktop viewport UI visual regression comparisons
if [ -n "$SHARD" ]; then
  echo "Running desktop tests with shard $SHARD..."
  npm run test:desktop-run -- --shard=$SHARD
else
  echo "Running all desktop tests..."
  npm run test:desktop-run
fi