terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }
}

# Providing a reference to our default VPC
resource "aws_default_vpc" "default_vpc" {
}

# Providing a reference to our default subnets

resource "aws_default_subnet" "default_subnet_1" {
  availability_zone = "us-west-1b"
}

resource "aws_default_subnet" "default_subnet_2" {
  availability_zone = "us-west-1c"
}
