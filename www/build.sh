#!/bin/bash

# This is dirty af but will do for now.

./node_modules/.bin/ember build --environment production
sudo rsync -a dist/* /var/www/etc2pool/ --delete
