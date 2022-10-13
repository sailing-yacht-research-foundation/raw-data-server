# raw-data-server
Server that saves scraped data to database, uploads geojson tracks to s3 bucket and index to elastic search.

---

- [Getting Started](#getting-started)
- [Deployment](#deployment)
  - [Automated](#automated)
  - [Manual](#manual)
    - [Terraform Configurations](#terraform-configurations)
    - [Terraform Commands](#terraform-commands)
    - [Terraform Known Issues](#terraform-known-issues)
  - [Development Deployment](#development-deployment)
- [Dockerize](#dockerize)
- [API Endpoint](#api-endpoint)
- [Unit Test](#unit-test)


# Getting Started

1. Clone this repository
2. Setup all the environment variables by creating a new `.env` file by copying the variables from `.env.example` file, then fill in the values.
3. Initialize git submodule by running `git submodule init` and `git submodule update`
4. Run `yarn install` to install dependencies
5. Run `yarn start` to start the server

# Deployment

## Automated
Raw data server is automatically deployed when merging/pushing to develop and main branch using github actions. These are configured on .github/workflows dev_backend.yml and prod_backend.yml respectively. You can also use dev-test branch to deploy to dev environment without committing changes to the develop branch.

## Manual
(Optional) Raw data server use dockerized terraform to create instances on the AWS. It's recommended to use aws-vault to generate the temporary credentials using the environment variables.

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
You can simply run the shell script `deploy.sh`:

1. Configure AWS cli by following steps here https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html
2. Check the variable in side the `deploy.sh` if it is correct, change it as needed before running the script
  AWS_ECR_REGISTRY=335855654610.dkr.ecr.us-east-1.amazonaws.com
  AWS_REGION=us-east-1
  ECR_REPO_NAME=raw-data-server
  ECR_TAG=latest

3. Run script `./deploy.sh`. This will build the docker image tag it and upload to AWS ECR.

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

# Dockerize

- Run `docker-compose up -d`
- Run `docker-compose down` to terminate
- Run `docker-compose -f docker-compose.yml run raw-data-server yarn run test` to run tests

If you have run docker previously using older version of the app, database structure changes might affect the tests results. Please remove the database volume before proceeding by executing commands below:

- Run `docker-compose down`
- List all the volume with `docker volume ls` and find raw-data-server_xxxx
- Execute `docker volume rm [volume_name]` with the `volume_name` value replaced with the name from the step above

# API Endpoint

Set an `Authorization` header containing md5 hash of current date with format: yyyy MMM d, ddd

- POST `/api/v1/upload-file`
  - Upload the raw json file or gzipped json file using multipart form data on `raw_data` field
  - Body (application/json):
    - raw-data (required): Json file compressed in gzip format that contains the scraped data to be saved

- GET `/api/v1/scraped-url/:tracker?status=BOTH`
  - Gets the list of existing urls success and/or failed with the original_id
  - Query:
    - status (optional): `BOTH` [default] | `SUCCESS` | `FAILED`
  - Route Parameter:
    - tracker (required): `BLUEWATER` | `ESTELA` | `GEORACING` | `GEOVOILE` | `ISAIL` | `KATTACK` | `KWINDOO` | `METASAIL` | `RACEQS` | `TACKTRACKER` | `TRACTRAC` | `YACHTBOT` | `YELLOWBRICK` | `SWIFTSURE`

- POST `/api/v1/register-failed-url`
  - Saves the url as failed url and the reason for failure
  - Body (application/json):
    - tracker (required): `BLUEWATER` | `ESTELA` | `GEORACING` | `GEOVOILE` | `ISAIL` | `KATTACK` | `KWINDOO` | `METASAIL` | `RACEQS` | `TACKTRACKER` | `TRACTRAC` | `YACHTBOT` | `YELLOWBRICK` | `SWIFTSURE`
    - url (required): URL of the failed scraper
    - error (required): Error detail

- GET `/get-unfinished-races/:tracker`
  - Gets a list of id and original_id of unfinished races (from elastic search)
  - Route Parameter:
    - tracker (required): `BLUEWATER` | `ESTELA` | `GEORACING` | `GEOVOILE` | `ISAIL` | `KATTACK` | `KWINDOO` | `METASAIL` | `RACEQS` | `TACKTRACKER` | `TRACTRAC` | `YACHTBOT` | `YELLOWBRICK` | `SWIFTSURE`

- POST `/clean-unfinished-races/:tracker`
  - Deletes all unfinished races (from elastic search) based from given source tracker
  - Route Parameter:
    - tracker (required): `BLUEWATER` | `ESTELA` | `GEORACING` | `GEOVOILE` | `ISAIL` | `KATTACK` | `KWINDOO` | `METASAIL` | `RACEQS` | `TACKTRACKER` | `TRACTRAC` | `YACHTBOT` | `YELLOWBRICK` | `SWIFTSURE`
  - Body (application/json):
    - excludedOrigIds: Array of original id to be excluded on the deletion

# Unit Test

To run unit test, simply run `yarn run test`. The unit tests are not testing per function but instead using sample test file per source and testing on the saveXXX file. It mocks all external services and database so it is safe to run locally anytime. It is also included to run on the CI when creating Pull Requests on github or pushing to develop and main branch
