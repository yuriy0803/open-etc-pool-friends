# Open ETC Pool Friends API Endpoints

## Finders

### Get Finders Information

- **Endpoint:** `/api/finders`
- **Method:** `GET`
- **Description:** Retrieve information about finders.
- **Response Format:** JSON

## General Pool Statistics

### Get General Pool Statistics

- **Endpoint:** `/api/stats`
- **Method:** `GET`
- **Description:** Retrieve general pool statistics.
- **Response Format:** JSON

## Miners

### Get Miners Information

- **Endpoint:** `/api/miners`
- **Method:** `GET`
- **Description:** Retrieve information about miners.
- **Response Format:** JSON

### Get Miner Information

- **Endpoint:** `/api/accounts/{login}`
- **Method:** `GET`
- **Parameters:**
  - `{login}`: Miner login address (e.g., `/api/accounts/0x123...`)
- **Description:** Retrieve information about a specific miner.
- **Response Format:** JSON

## Blocks

### Get Blocks Information

- **Endpoint:** `/api/blocks`
- **Method:** `GET`
- **Description:** Retrieve information about blocks.
- **Response Format:** JSON

## Payments

### Get Payments Information

- **Endpoint:** `/api/payments`
- **Method:** `GET`
- **Description:** Retrieve information about payments.
- **Response Format:** JSON

## Settings

### Subscribe to Updates

- **Endpoint:** `/api/settings`
- **Method:** `POST`
- **Parameters:**
  - `ip_address`: IP address of the client.
  - `login`: Miner login address.
  - `threshold` (optional): Subscription threshold (default: 0.5).
- **Description:** Subscribe to updates by providing client information.
- **Response Format:** JSON

## Examples

### Get General Pool Statistics

```bash
curl http://localhost:8080/api/stats
