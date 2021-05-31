# raw-data-server

Server that will be used to transform data to parquet format and perform bulk saving into Permanent Storage

---

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoint](#api-endpoint)

## Installation

1. Clone this repository
2. Run `yarn` to install dependencies

## Configuration

- Setup all the environment variables before proceeding to the next step.
  -- `AWS_S3_ACCESS_KEY_ID`: Used to upload file to s3
  -- `AWS_S3_SECRET_ACCESS_KEY`: Used to upload file to s3
  -- `AWS_S3_BUCKET`: The s3 Bucket to upload parquet files
  -- `DB_HOST`: The database Host/IP Address
  -- `DB_PORT`: Port of the database
  -- `DB_USER`: User to connect to database
  -- `DB_PASSWORD`: Password to connect to database
  -- `DB_NAME`: Database name to connect

- Run `scripts/initdb.sql` to install test database

## Usage

- Run `docker-compose up -d`
- Run `docker-compose down` to terminate
- Run `docker-compose -f docker-compose.yml run raw-data-server npm run test` to run tests

If you have run docker previously using older version of the app, database structure changes might affect the tests. Please run `docker-compose down` and execute `docker volume rm [volume_name]` on the rds-db volume.

## API Endpoint

- `/api/v1/upload-file`
  -- Set an `Authorization` header containing md5 hash of current date with format: yyyy MMM d, ddd
  -- Upload the raw json file using multipart form data on `raw_data` field
