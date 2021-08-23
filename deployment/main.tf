terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }

  backend "s3" {
    bucket = "syrf-rawdata-terraform-state"
    key    = "global/s3/terraform.tfstate"
    region = "us-east-1"
  
    dynamodb_table = "terraform-state-locking"
    encrypt        = true
  }
}
# Providing a reference to our default VPC
resource "aws_vpc" "syrf-vpc" {
  cidr_block = "10.16.0.0/16"
  enable_dns_support = true
  enable_dns_hostnames = true

  tags = {
    Name = "syrf-vpc"
  }
}

# Providing a reference to our default subnets
resource "aws_subnet" "public_subnet" {
  count             = length(var.aws_subnets_cidr)
  vpc_id            = aws_vpc.syrf-vpc.id
  cidr_block        = var.aws_subnets_cidr[count.index]
  availability_zone = var.aws_availability_zones[count.index]

  tags = {
    Name = "syrf-public"
  }
}


resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.syrf-vpc.id
  cidr_block        = "10.16.64.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "syrf-private"
  }
}

# 3. create internet gateway
resource "aws_internet_gateway" "syrf-gw" {
  vpc_id = aws_vpc.syrf-vpc.id

  tags = {
    Name = "syrf-igw"
  }
}

# 4. elastic ip for nat gateway
resource "aws_eip" "syrf-nateIP" {
  vpc = true
}


# is this intentional? you write nat gateway for private subnet. na public subnet i dey see
# 5. create the NAT gateway for private subnet
resource "aws_nat_gateway" "syrf-NATgw" {
  allocation_id = aws_eip.syrf-nateIP.id
  #subnet_id = aws_subnet.public_1.id
  subnet_id = aws_subnet.public_subnet[0].id
  

}


# 6. create custom route table for public subnet
resource "aws_route_table" "syrf-publicRT" {
  vpc_id = aws_vpc.syrf-vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.syrf-gw.id
  }

  tags = {
    Name = "syrf-route-table"
  }
}

# 7. create custom route table for private subnet
resource "aws_route_table" "syrf-privateRT" {
  vpc_id = aws_vpc.syrf-vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.syrf-NATgw.id
  }

  tags = {
    Name = "syrf-route-table"
  }
}
# 8. associate subnet with route table
resource "aws_route_table_association" "publicRT-ass" {
  subnet_id      = aws_subnet.public_subnet[0].id
  route_table_id = aws_route_table.syrf-publicRT.id
}

# 9. associate subnet with route table
resource "aws_route_table_association" "privateRTass" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.syrf-privateRT.id
}

