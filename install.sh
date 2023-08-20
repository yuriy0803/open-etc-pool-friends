#!/bin/bash

echo "Welcome to the installation!"

# Update and upgrade the package list
sudo apt-get update && sudo apt-get upgrade

# Install npm, rsync, git, redis-server, and nginx
sudo apt-get install npm rsync git redis-server nginx

# Install Node.js Version 14.x
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs

# Download and install Go 1.21.0
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz

# Create a symbolic link for the Go binary
sudo ln -s /usr/local/go/bin/go /usr/local/bin/go

# Check the installed Go version
go version

echo "Installation completed!"

