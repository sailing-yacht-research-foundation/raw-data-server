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

- Setup all the environment variables before proceeding to the next step. Create a new `.env` file and copy the variables from `.env.example` file, then fill in the values.

| Variable Name            | Type   | Default | Description                                              |
| ------------------------ | ------ | ------- | -------------------------------------------------------- |
| AWS_S3_ACCESS_KEY_ID     | string | N/A     | AWS Access Key to upload file to S3 (Need S3 permission) |
| AWS_S3_SECRET_ACCESS_KEY | string | N/A     | AWS Secret Key for the associated access key             |
| AWS_S3_BUCKET            | string | N/A     | AWS S3 bucket name                                       |

- Run `scripts/initdb.sql` to install test database. This is unnecessary if `docker-compose up` is executed.

## Usage

- Run `docker-compose up -d`
- Run `docker-compose down` to terminate
- Run `docker-compose -f docker-compose.yml run raw-data-server npm run test` to run tests

If you have run docker previously using older version of the app, database structure changes might affect the tests results. Please remove the database volume before proceeding by executing commands below:

- Run `docker-compose down`
- List all the volume with `docker volume ls` and find raw-data-server_xxxx
- Execute `docker volume rm [volume_name]` with the `volume_name` value replaced with the name from the step above

## API Endpoint

- `/api/v1/upload-file`
  - Set an `Authorization` header containing md5 hash of current date with format: yyyy MMM d, ddd
  - Upload the raw json file using multipart form data on `raw_data` field
