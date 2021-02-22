#!/bin/bash

./node_modules/.bin/ember build --environment production
sudo rsync -a dist/* /var/www/etcpool/ --delete