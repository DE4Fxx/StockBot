#!/bin/sh

echo "========================================="
echo "   DEBUGGING CONTAINER FILE STRUCTURE    "
echo "========================================="


echo "\n[1] Current working directory:"
pwd

echo "\n[2] Contents of root workspace (/usr/src/stockbot):"
ls -la

echo "\n[3] Contents of the src/ folder (if it exists):"
ls -la src || echo "[-] ERROR: src folder does not exist!"

echo "========================================="
echo "   ATTEMPTING TO RUN INDEX AS FALLBACK   "
echo "========================================="

# We comment out the failing commands file for a moment so the container doesn't immediately crash
# node src/commands.js
cd ./src
mkdir -p logs
exec node commands.js &
exec node index.js