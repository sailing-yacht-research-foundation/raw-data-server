# raw-data-server

Server that will be used to transform data to parquet format and perform bulk saving into Permanent Storage

---

- [raw-data-server](#raw-data-server)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Deployment](#deployment)
    - [Terraform Configurations](#terraform-configurations)
    - [Terraform Commands](#terraform-commands)
    - [Terraform Known Issues](#terraform-known-issues)
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

- Run `aws-vault exec [profile] --duration=12h -- CMD.EXE` (Omit the `-- CMD.EXE` if not using windows).
  This will generate `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` to the environment variables that is used by our dockerized terraform.
- Run `docker-compose -f deployment/docker-compose.yml config` to check the configurations for terraform. It should display your AWS Access Key and Secret Key in the docker compose configurations.

Or create a new .env file inside deployment folder with these variables:
| Variable Name | Type | Default | Description |
| ------------------------ | ------ | ------- | -------------------------------------------------------- |
| AWS_ACCESS_KEY_ID | string | N/A | AWS Access Key to for terraform |
| AWS_SECRET_ACCESS_KEY | string | N/A | AWS Secret Key for the associated access key |

And run `docker-compose -f deployment/docker-compose.yml --env-file deployment/.env config`

If you get an error message: "CannotPullContainerError: inspect image has been retried x time(s)", you will also need to push the docker image to the ECR using the push commands from the AWS console after terraform successfully created the infrastructure.
You can simply run the shell script deploy.sh:

1. Check the variable in side the deploy.sh if it is correct, change it as needed before running the script
  AWS_ECR_REGISTRY=335855654610.dkr.ecr.us-east-1.amazonaws.com
  AWS_REGION=us-east-1
  ECR_REPO_NAME=raw-data-server
  ECR_TAG=latest

2. Run script `./deploy.sh`. This will build the docker image tag it and upload to AWS ECR.

If this is the first time run, you will need to run terraform init and apply (commands below)

### Terraform Configurations

AWS requires to use an MFA to perform IAM operation with an assume-role, please add MFA device to the Security Credentials of the access key, and add the serial into the local aws config on the profile.

### Terraform Commands

- To initialize terraform container, run `docker-compose -f deployment/docker-compose.yml run --rm terraform init`
- To validate terraform configurations, run `docker-compose -f deployment/docker-compose.yml run --rm terraform validate`
- To format the terraform configuration files, run `docker-compose -f deployment/docker-compose.yml run --rm terraform fmt`
- To check terraform resources to be created, run `docker-compose -f deployment/docker-compose.yml run --rm terraform plan`
- To apply the terraform configurations, run `docker-compose -f deployment/docker-compose.yml run --rm terraform apply`
- To destroy the instances createdd by terraform, run `docker-compose -f deployment/docker-compose.yml run --rm terraform destroy`

### Terraform Known Issues

- A change in the backend configuration has been detected, which may require migrating existing state.
  If you have run terraform previously before backend setup with s3 is implemented, you need to remove all the state and lock files from your local deployment folder, or run init with -migrate-state option

- Failed to get existing workspaces: S3 bucket does not exist.
  The s3 bucket used by terraform needs to be created before init. It's possible to create s3 bucket and dynamoDB with terraform, but needs to comment out the terraform backend block before proceeding and then uncomment after successfully applied. Or create a separate terraform config just for the s3 bucket and dynamoDB.

## Usage

- Run `docker-compose up -d`
- Run `docker-compose down` to terminate
- Run `docker-compose -f docker-compose.yml run raw-data-server npm run test` to run tests

If you have run docker previously using older version of the app, database structure changes might affect the tests results. Please remove the database volume before proceeding by executing commands below:

- Run `docker-compose down`
- List all the volume with `docker volume ls` and find raw-data-server_xxxx
- Execute `docker volume rm [volume_name]` with the `volume_name` value replaced with the name from the step above

## API Endpoint

Set an `Authorization` header containing md5 hash of current date with format: yyyy MMM d, ddd

- `/api/v1/upload-file`

  - Method: POST
  - Upload the raw json file or gzipped json file using multipart form data on `raw_data` field

- `/api/v1/scraped-url/{tracker}?status=BOTH`

  - Method: GET
  - Query:
    - status (optional): `BOTH` [default] | `SUCCESS` | `FAILED`
  - Route Parameter:
    - tracker (required): `BLUEWATER` | `ESTELA` | `GEORACING` | `ISAIL` | `KATTACK` | `KWINDOO` | `METASAIL` | `RACEQS` | `TACKTRACKER` | `TRACTRAC` | `YACHTBOT` | `YELLOWBRICK` | `SWIFTSURE`

- `/api/v1/check-url`

  - Method: POST
  - Body (application/json):
    - tracker (required): `BLUEWATER` | `ESTELA` | `GEORACING` | `ISAIL` | `KATTACK` | `KWINDOO` | `METASAIL` | `RACEQS` | `TACKTRACKER` | `TRACTRAC` | `YACHTBOT` | `YELLOWBRICK` | `SWIFTSURE`
    - url (required if originalId is not provided): URL of the race/event
    - originalId (required if url is not provided): Original ID of race/event

- `/api/v1/register-failed-url`

  - Method: POST
  - Body (application/json):
    - tracker (required): `BLUEWATER` | `ESTELA` | `GEORACING` | `ISAIL` | `KATTACK` | `KWINDOO` | `METASAIL` | `RACEQS` | `TACKTRACKER` | `TRACTRAC` | `YACHTBOT` | `YELLOWBRICK` | `SWIFTSURE`
    - url (required): URL of the failed scraper
    - error (required): Error detail

- `/api/v1/americas-cup-2021`

  - Method: POST
  - Query:
    - bucketName (required): Bucket name which has americas cup 2021 race jsons
  - Trigger the saving and normalization of Americas Cup 2021 Data.

- `/api/v1/americas-cup`

  - Method: POST
  - Body (application/json):
    - bucketName (required): bucket name in s3 where the raw data will be downloaded
    - fileName (required): file name of the zip file to be downloaded and extracted. The folder structure inside the zip file needs to have a specific folder structure as seen in ./src/test-files/americasCup2013 or ./src/test-files/americasCup2016
    - year (required): Year when the americas cup event happened

## Development Deployment
- This service was deployed to AWS development environment using terraform
- The terraform files includes s3 backend to keep the terraform state, customized vpc was deployed, other network components needed for the deployment of the raw data server application
- The VPC has 3 public subnets and 1 private subnet. with nat gateway in the public subnet
- The ecs service was deployed in the private subnet
- Before you run the tf file make sure the aws access key and secret access key is present in the .env file
- The mq server was deployed manually within the same vpc as the raw-data server so they can communicate with the container in ECS without any issues
- For the deployment of the this service you need to run
docker-compose -f deployment/docker-compose.yml run --rm terraform init
docker-compose -f deployment/docker-compose.yml run --rm terraform validate
docker-compose -f deployment/docker-compose.yml run --rm terraform plan
docker-compose -f deployment/docker-compose.yml run --rm terraform apply
when you run terraform apply you will need to input the some values for the mq server
- The credentials for the mq server are used in the terraform variable file
- After running the terraform apply, the docker image was built and pushed to elastic container registry
- The service can be accessed from this url - http://raw-data-server-lb-1246447046.us-east-1.elb.amazonaws.com/
