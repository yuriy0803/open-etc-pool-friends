#!/bin/bash

# Install required packages
echo "Checking if 'unzip' and 'jq' are installed..."
sudo apt update
sudo apt install -y unzip jq

# Automatically detect the user's home directory
USER_HOME="$HOME"
GETH_DIR="$USER_HOME"
PASSWORD_FILE="$USER_HOME/wallet_password.txt"
ADDRESS_FILE="$USER_HOME/wallet_address.txt"
WALLET_DIR="$USER_HOME/keystore"

# Function to choose Geth version
choose_version() {
    echo "Fetching available Core Geth versions..."
    VERSIONS=$(curl -s https://api.github.com/repos/etclabscore/core-geth/releases | jq -r '.[].tag_name')
    echo "Available Core Geth Versions:"
    select VERSION in $VERSIONS; do
        if [[ -n "$VERSION" ]]; then
            echo "Selected version: $VERSION"
            break
        else
            echo "Invalid selection. Please choose a valid number."
        fi
    done
}

# Function to choose the ZIP file
choose_zip_file() {
    echo "Fetching available ZIP files for version $VERSION..."
    ASSETS=$(curl -s https://api.github.com/repos/etclabscore/core-geth/releases/tags/$VERSION | jq -r '.assets[] | .browser_download_url')
    echo "Available ZIP files:"
    select ASSET in $ASSETS; do
        if [[ -n "$ASSET" ]]; then
            echo "Selected file: $ASSET"
            break
        else
            echo "Invalid selection. Please choose a valid file."
        fi
    done
}

# Download and extract Geth
download_and_extract_geth() {
    echo "Downloading Core Geth: $ASSET"
    curl -L $ASSET -o "$GETH_DIR/core-geth.zip"
    echo "Extracting Core Geth..."
    unzip -q "$GETH_DIR/core-geth.zip" -d "$GETH_DIR"
    chmod +x "$GETH_DIR/geth"
}

# Create wallet
create_wallet() {
    echo "Please enter a password for the wallet:"
    read -s WALLET_PASSWORD
    echo "Please confirm the password:"
    read -s WALLET_PASSWORD_CONFIRM

    if [ "$WALLET_PASSWORD" != "$WALLET_PASSWORD_CONFIRM" ]; then
        echo "Passwords do not match. Please try again."
        exit 1
    fi

    echo "$WALLET_PASSWORD" > "$PASSWORD_FILE"
    echo "Creating new wallet..."
    WALLET_ADDRESS=$(./geth account new --password "$PASSWORD_FILE" | grep -o '0x[0-9a-fA-F]\{40\}')
    if [ -z "$WALLET_ADDRESS" ]; then
        echo "Error: Could not extract wallet address!"
        exit 1
    fi

    echo "Wallet address: $WALLET_ADDRESS"
    echo "$WALLET_ADDRESS" > "$ADDRESS_FILE"
    echo "Core Geth successfully downloaded and installed at: $GETH_DIR/geth"
    echo "Wallet address and password have been saved."
}

# Delete downloaded Core Geth ZIP file
delete_zip_file() {
    echo "Deleting the downloaded ZIP file..."
    rm -f "$GETH_DIR/core-geth.zip"
    if [ ! -f "$GETH_DIR/core-geth.zip" ]; then
        echo "The ZIP file was successfully deleted."
    else
        echo "Error deleting the ZIP file!"
    fi
}

# Main process
choose_version
choose_zip_file
download_and_extract_geth
create_wallet
delete_zip_file
