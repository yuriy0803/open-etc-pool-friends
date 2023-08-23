#!/bin/bash

set -x  # Enable displaying all commands

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

# Get the local IP address of the Linux system
ip_address=$(hostname -I | cut -d' ' -f1)

# Configure Nginx
sudo sh -c 'cat > /etc/nginx/sites-available/default <<EOF
# Default server configuration
# nginx example

upstream api {
    server 127.0.0.1:8080;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/etc2pool;

    # Add index.php to the list if you are using PHP
    index index.html index.htm index.nginx-debian.html;

    server_name _;

    location / {
            # First attempt to serve request as file, then
            # as directory, then fall back to displaying a 404.
            try_files $uri $uri/ =404;
    }

    location /api {
            proxy_pass http://127.0.0.1:8080;
    }

}
EOF'

# Reload Nginx configuration
sudo systemctl reload nginx

# Build the Go application
go build

# Create modified content with IP address
modified_content="/* jshint node: true */

module.exports = function (environment) {
  var ENV = {
    modulePrefix: 'open-etc-pool',
    environment: environment,
    rootURL: '/',
    locationType: 'hash',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // API host and port
      ApiUrl: '//$ip_address/',

      // HTTP mining endpoint
      HttpHost: 'http://$ip_address',
      HttpPort: 8888,

      // Stratum mining endpoint
      StratumHost: 'example.net',
      StratumPort: 8008,

      // The ETC network
      Unit: 'ETC',
      Currency: 'USD',

      // Fee and payout details
      PoolFee: '1%',
      PayoutThreshold: '0.5 ETC',
      BlockReward: 2.56,

      // For network hashrate (change for your favourite fork)
      BlockTime: 13.2
    }
  };

  if (environment === 'development') {
    /* Override ApiUrl just for development, while you are customizing
      frontend markup and css theme on your workstation.
    */
    ENV.APP.ApiUrl = 'http://localhost:8080/'
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {

  }

  return ENV;
};"

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

set +x  # Disable displaying commands
echo "Installation completed!"
