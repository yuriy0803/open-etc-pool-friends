#!/bin/bash

# This is a shell script to reset a Redis pool.

# Define the Redis CLI command to flush the specified database.
REDIS_CLI="redis-cli"
DB_NUMBER=0

# Function to reset the Redis pool.
reset_redis_pool() {
    $REDIS_CLI -n $DB_NUMBER flushdb
    echo "Redis pool reset complete."
}

# Call the function to reset the Redis pool.
reset_redis_pool
