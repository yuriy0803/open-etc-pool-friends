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
export PATH=$PATH:/usr/local/go/bin

# Create a symbolic link for the Go binary
sudo ln -s /usr/local/go/bin/go /usr/local/bin/go

# Configure Nginx
sudo sh -c 'cat > /etc/nginx/sites-available/default <<EOF
upstream api {
	server 127.0.0.1:8080;
}

server {
	listen 0.0.0.0:80;
	root /var/www/etc2pool;
	index index.html index.htm;

	server_name localhost;

	location /api {
		proxy_pass http://127.0.0.1:8080;
	}

	location / {
		try_files $uri $uri/ /index.html;
	}
}
EOF'

# Reload Nginx configuration
sudo systemctl reload nginx

echo "Installation completed!"
