#!/bin/sh

# This is the Server install script.
echo "open-etc-pool-friends update"
echo "Please do NOT run as root, run as the pool user!"
echo "If it not exist, create the pool user!"

sleep 2

echo "Update... Please wait!"

git stash
git pull

echo ""
echo "Update complete!"
echo ""

exit 0
