# 1. create vpc 
resource "aws_vpc" "syrf-vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "syrf-vpc"
  }
}

# 2. create a subnet
resource "aws_subnet" "public_1" {
  vpc_id     = aws_vpc.syrf-vpc.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "syrf-public-subnet1"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id     = aws_vpc.syrf-vpc.id
  cidr_block = "10.0.32.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "syrf-private-subnet1"
  }
}

# 3. create internet gateway
resource "aws_internet_gateway" "syrf-gw" {
  vpc_id = aws_vpc.syrf-vpc.id

  tags = {
    Name = "syrf-igw"
  }
}

# 4. create custom route table for public subnet
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

# 5. create custom route table for private subnet
resource "aws_route_table" "syrf-privateRT" {
  vpc_id = aws_vpc.syrf-vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.syrf-NATgw.id
  }

  tags = {
    Name = "syrf-route-table"
  }
}
# 6. associate subnet with route table
resource "aws_route_table_association" "publicRT-ass" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.syrf-publicRT.id
}

# 7. associate subnet with route table
resource "aws_route_table_association" "privateRTass" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.syrf-privateRT.id
}

# 8. elastic ip for nat gateway
resource "aws_eip" "syrf-nateIP" {
   vpc   = true
 }

# 9. create the NAT gateway for private subnet
resource "aws_nat_gateway" "syrf-NATgw" {
   allocation_id = aws_eip.syrf-nateIP.id
   subnet_id = aws_subnet.public_1.id
 }