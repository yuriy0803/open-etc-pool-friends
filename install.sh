#!/bin/bash

set -x  # Enable displaying all commands

echo "Welcome to the installation!"

# Update and upgrade the package list
sudo apt-get update && sudo apt-get upgrade -y

# Install npm, rsync, git, redis-server, and nginx
sudo apt-get install npm rsync git redis-server nginx -y

sudo systemctl enable nginx
sudo systemctl start nginx

sudo rm -f /etc/nginx/sites-available/default
sudo rm -f /etc/nginx/sites-enabled/default
sudo apt-get install python3-certbot-nginx

# Install Node.js Version 14.x
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs

# Download and install Go 1.21.0
wget https://golang.org/dl/go1.21.0.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz

# Create a symbolic link for the Go binary
sudo ln -s /usr/local/go/bin/go /usr/local/bin/go

# Get the local IP address of the Linux system
ip_address=$(hostname -I | cut -d' ' -f1)

# Build the Go application
go build

# Create modified content with IP address
modified_content=$(cat <<EOF
/* jshint node: true */

module.exports = function (environment) {
  var ENV = {
    modulePrefix: 'open-etc-pool',
    environment: environment,
    rootURL: '/',
    locationType: 'hash',
    EmberENV: {
      FEATURES: {}
    },
    APP: {
      ApiUrl: '//$ip_address/',
      HttpHost: 'http://$ip_address',
      HttpPort: 8888,
      StratumHost: 'example.net',
      StratumPort: 8008,
      Unit: 'ETC',
      Currency: 'USD',
      PoolFee: '1%',
      PayoutThreshold: '0.5 ETC',
      BlockReward: 2.56,
      BlockTime: 13.2
    }
  };

  if (environment === 'development') {
    ENV.APP.ApiUrl = 'http://localhost:8080/';
  }

  if (environment === 'test') {
    ENV.locationType = 'none';
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;
    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {}

  return ENV;
};
EOF
)

# Write modified content to environment.js
echo "$modified_content" > www/config/environment.js

# Change into the www directory
cd www

# Install ember-cli and bower globally
sudo npm install -g ember-cli@2.18.2
sudo npm install -g bower

# Change ownership of npm and config directories
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config

# Install npm and bower dependencies
npm install
bower install

# Install ember-truth-helpers
ember install ember-truth-helpers

# Install jdenticon
npm install jdenticon@2.1.0

# Run the build.sh script within the www directory
bash build.sh

# Change back to the main directory
cd ..

# Nginx configuration
nginx_config=$(cat <<EOF
upstream api {
    server 127.0.0.1:8080;
}

server {
    listen *:80;
    listen [::]:80;
    root /var/www/etc2pool;

    index index.html index.htm index.nginx-debian.html;
    server_name _;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location /api {
        proxy_pass http://127.0.0.1:8080;
    }
}
EOF
)

# Path to the pool configuration file
pool_config_path="/etc/nginx/sites-available/pool"

# Write the Nginx configuration to the pool configuration file
echo "$nginx_config" | sudo tee "$pool_config_path" > /dev/null

# Create a symbolic link in the sites-enabled directory
sudo ln -s "$pool_config_path" "/etc/nginx/sites-enabled/"

# Restart Nginx to apply the changes
sudo systemctl restart nginx

set +x  # Disable displaying commands
echo "Installation completed!"
