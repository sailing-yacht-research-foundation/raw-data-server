variable "aws_region" {
  default     = "us-west-1"
  description = "Which region should the resources be deployed into?"
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