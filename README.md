# raw-data-server

Server that will be used to transform data to parquet format and perform bulk saving into Permanent Storage

---

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoint](#api-endpoint)

## Installation

1. Clone this repository
2. Run `yarn` to install dependencies

## Usage

- Run `docker-compose up -d`
- Run `docker-compose down` to terminate
- Run `docker-compose -f docker-compose.yml run raw-data-server npm run test` to run tests

## API Endpoint

- `/api/v1/upload-file`
  -- Set an `Authorization` header containing md5 hash of current date with format: yyyy MMM d, ddd
  -- Upload the raw json file using multipart form data on `raw_data` field
