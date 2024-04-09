#!/bin/bash

set -x  # Enable displaying all commands

echo "Welcome to the installation!"

# Update and upgrade the package list
sudo apt-get update && sudo apt-get upgrade -y

# Install npm, rsync, git, redis-server, nginx, and fail2ban
sudo apt-get install npm rsync git ipset redis-server nginx fail2ban -y

# Configure Fail2Ban for SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo sed -i '/^\[sshd\]$/a enabled = true\nmaxretry = 3\nfindtime = 600\nbantime = 3600' /etc/fail2ban/jail.local

# Restart Fail2Ban to apply changes
sudo systemctl restart fail2ban

# Run journalctl vacuum
sudo journalctl --vacuum-size=500M

sudo ipset create blacklist hash:ip

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
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // API host and port
      ApiUrl: '//$ip_address/',

      // HTTP mining endpoint
      HttpHost: '$ip_address',
      HttpPort: 8888,

      // Stratum mining endpoint
      StratumHost: '$ip_address',
      StratumPort: 8008,

      // The ETC network
      Unit: 'ETC',
      Mining: 'SOLO',

      // Fee and payout details
      PoolFee: '1.0%',
      PayoutThreshold: '0.5 ETC',
      BlockReward: 2.56,

      blockExplorerLink: 'https://explorer.test.network/',
      blockExplorerLink_tx: 'https://explorer.test.network/tx/',
      blockExplorerLink_uncle: 'https://explorer.test.network/uncles/',
      blockExplorerLink_block: 'https://etc.explorer.com/block/',
      blockExplorerLink_address: 'https://explorer.test.network/address/',

      // For network hashrate (change for your favourite fork)
      BlockTime: 14.4,
      highcharts: {
        main: {
          enabled: true,
          height: 200,
          type: 'spline',
          color: '',
          labelColor: '#909090',
          lineColor: '#404850',
          tickColor: '#404850',
          gridLineColor: '#404850',
          gridLineWidthX: 1,
          gridLineWidthY: 1,
          backgroundColor: 'transparent',
          title: '',
          ytitle: '',
          interval: 180000,
          chartInterval: 900000
        },
        account: {
          enabled: true,
          height: 300,
          type: 'spline',
          color: ['', ''],
          title: '',
          ytitle: '',
          interval: 180000,
          chartInterval: 900000,
          paymentInterval: 30000
        }
      }
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
        try_files $uri $uri/ =404;
    }

    location /api {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
