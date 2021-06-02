# raw-data-server

Server that will be used to transform data to parquet format and perform bulk saving into Permanent Storage

---

- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
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

## Deployment

Raw data server use dockerized terraform to create instances on the AWS. It's recommended to use aws-vault to generate the temporary credentials using the environment variables.

- Run `aws-vault exec alvinjk --duration=12h -- CMD.EXE` (Omit the `-- CMD.EXE` if not using windows).
  This will generate `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` to the environment variables that is used by our dockerized terraform.
- Run `docker-compose -f deployment/docker-compose.yml config` to check the configurations for terraform. It should display your AWS Access Key and Secret Key in the docker compose configurations.

Or create a new .env file inside deployment folder with these variables:
| Variable Name | Type | Default | Description |
| ------------------------ | ------ | ------- | -------------------------------------------------------- |
| AWS_ACCESS_KEY_ID | string | N/A | AWS Access Key to for terraform |
| AWS_SECRET_ACCESS_KEY | string | N/A | AWS Secret Key for the associated access key |

And run `docker-compose -f deployment/docker-compose.yml --env-file deployment/.env config`

### Terraform configurations

AWS requires to use an MFA to perform IAM operation with an assume-role, please add MFA device to the Security Credentials of the access key, and add the serial into the local aws config on the profile.

### Terraform Commands

- To initialize terraform container, run `docker-compose -f deployment/docker-compose.yml run --rm terraform init`
- To validate terraform configurations, run `docker-compose -f deployment/docker-compose.yml run --rm terraform validate`
- To format the terraform configuration files, run `docker-compose -f deployment/docker-compose.yml run --rm terraform fmt`
- To check terraform resources to be created, run `docker-compose -f deployment/docker-compose.yml run --rm terraform plan`
- To apply the terraform configurations, run `docker-compose -f deployment/docker-compose.yml run --rm terraform apply`
- To destroy the instances createdd by terraform, run `docker-compose -f deployment/docker-compose.yml run --rm terraform destroy`

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
