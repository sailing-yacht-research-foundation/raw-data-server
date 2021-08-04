variable "aws_region" {
  default     = "us-east-1"
  description = "Which region should the resources be deployed into?"
}

variable "aws_availability_zones" {
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
  description = "Availability zone list"
}

variable "db_username" {
  default     = "user"
  description = "Username for MySQL Database"
}

variable "db_name" {
  default     = "rawdata"
  description = "Database name"
}

variable "app_container_port" {
  default     = 3000
  description = "Container Port"
}

variable "s3_access_key_id" {
  type    = string
}

variable "s3_secret_key" {
  type    = string
}

variable "s3_bucket" {
  type    = string
}

variable "mq_host" {
  type    = string
}

variable "mq_port" {
  type    = string
}

variable "mq_user" {
  type    = string
}

variable "mq_password" {
  type    = string
}

variable "mq_topic" {
  default = "/topic/rawdata.topic"
}

variable "mq_timeout" {
  default = 2700000
}

variable "es_host" {
  type = string
}

variable "geojson_s3_bucket" {
  default = "syrf-rawdataserver-geojson-staging"
  type = string
}

variable "yellowbrick_kml_s3_bucket" {
  default = "syrf-rawdataserver-yellowbrick-kml-staging"
  type = string
}