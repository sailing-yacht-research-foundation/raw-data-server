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

resource "aws_default_subnet" "default_subnet_b" {
  availability_zone = "us-west-1b"
}

resource "aws_default_subnet" "default_subnet_c" {
  availability_zone = "us-west-1c"
}



resource "aws_efs_file_system" "rds_fs" {
  creation_token = "rds_fs"

  tags = {
    Name = "EFS-RawDataServer"
  }
}

resource "aws_efs_mount_target" "mount_1" {
  file_system_id = aws_efs_file_system.rds_fs.id
  subnet_id      = aws_default_subnet.default_subnet_b.id

  security_groups  = [aws_security_group.service_security_group.id]
}

resource "aws_efs_mount_target" "mount_2" {
  file_system_id = aws_efs_file_system.rds_fs.id
  subnet_id      = aws_default_subnet.default_subnet_c.id

  security_groups  = [aws_security_group.service_security_group.id]
}

resource "aws_efs_access_point" "rds_eap" {
  file_system_id = aws_efs_file_system.rds_fs.id
}

resource "aws_ecs_task_definition" "rds_task" {
  family                   = "rds-task"
  container_definitions    = <<DEFINITION
  [
    {
      "name": "rds-task",
      "image": "${aws_ecr_repository.raw_data_server_ecr_repo.repository_url}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000
        }
      ],
      "environment": [
        { "name": "DB_HOST", "value": "localhost" },
        { "name": "DB_USER", "value": "user" },
        { "name": "DB_PASSWORD", "value": "password" },
        { "name": "DB_NAME", "value": "rawdata" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "rawdataserver",
          "awslogs-region": "us-west-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "memory": 256,
      "cpu": 128
    },
    {
      "name": "rds-db",
      "image": "mysql:5.7",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3306,
          "hostPort": 3306
        }
      ],
      "environment": [
        { "name": "MYSQL_DATABASE", "value": "rawdata" },
        { "name": "MYSQL_USER", "value": "user" },
        { "name": "MYSQL_PASSWORD", "value": "password" },
        { "name": "MYSQL_ROOT_PASSWORD", "value": "password" }
      ],
      "memory": 256,
      "cpu": 128,
      "mountPoints": [
          {
              "containerPath": "/var/lib/rds",
              "sourceVolume": "rds-storage"
          }
      ]
    }
  ]
  DEFINITION
  requires_compatibilities = ["FARGATE"] # Stating that we are using ECS Fargate
  network_mode             = "awsvpc"    # Using awsvpc as our network mode as this is required for Fargate
  memory                   = 512         # Specifying the memory our container requires
  cpu                      = 256         # Specifying the CPU our container requires
  execution_role_arn       = aws_iam_role.ecsTaskExecutionRole.arn

  volume {
    name = "rds-storage"

    efs_volume_configuration {
      file_system_id          = aws_efs_file_system.rds_fs.id
      root_directory          = "/opt/data"
      transit_encryption      = "ENABLED"
      transit_encryption_port = 2999
      authorization_config {
        access_point_id = aws_efs_access_point.rds_eap.id
        iam             = "DISABLED"
      }
    }
  }
}

resource "aws_iam_role" "ecsTaskExecutionRole" {
  name               = "ecsTaskExecutionRoleRawData"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "ecsTaskExecutionRole_policy" {
  role       = aws_iam_role.ecsTaskExecutionRole.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}



resource "aws_ecs_service" "rds_service" {
  name            = "rds-service"                        # Naming our first service
  cluster         = aws_ecs_cluster.rds_cluster.id       # Referencing our created Cluster
  task_definition = aws_ecs_task_definition.rds_task.arn # Referencing the task our service will spin up
  launch_type     = "FARGATE"
  desired_count   = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.target_group.arn
    container_name   = aws_ecs_task_definition.rds_task.family
    container_port   = 3000 # Specifying the container port
  }

  network_configuration {
    subnets          = [aws_default_subnet.default_subnet_b.id, aws_default_subnet.default_subnet_c.id]
    assign_public_ip = true # Providing our containers with public IPs
    security_groups  = [aws_security_group.service_security_group.id]
  }
}

resource "aws_security_group" "service_security_group" {
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    # Only allowing traffic in from the load balancer security group
    security_groups = [aws_security_group.load_balancer_security_group.id]
  }

  ingress {
    from_port = 2049
    to_port   = 2049
    protocol  = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0             # Allowing any incoming port
    to_port     = 0             # Allowing any outgoing port
    protocol    = "-1"          # Allowing any outgoing protocol 
    cidr_blocks = ["0.0.0.0/0"] # Allowing traffic out to all IP addresses
  }
}


resource "aws_alb" "application_load_balancer" {
  name               = "rds-lb-tf"
  load_balancer_type = "application"
  subnets = [
    aws_default_subnet.default_subnet_b.id,
    aws_default_subnet.default_subnet_c.id
  ]
  # Referencing the security group
  security_groups = [aws_security_group.load_balancer_security_group.id]
}

# Creating a security group for the load balancer:
resource "aws_security_group" "load_balancer_security_group" {
  ingress {
    from_port   = 80 # Allowing traffic in from port 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Allowing traffic in from all sources
  }

  ingress {
    from_port = 2049
    to_port   = 2049
    protocol  = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0             # Allowing any incoming port
    to_port     = 0             # Allowing any outgoing port
    protocol    = "-1"          # Allowing any outgoing protocol 
    cidr_blocks = ["0.0.0.0/0"] # Allowing traffic out to all IP addresses
  }
}

resource "aws_lb_target_group" "target_group" {
  name        = "target-group"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_default_vpc.default_vpc.id
  health_check {
    matcher = "200,301,302"
    path    = "/"
    timeout = 30
    interval= 60
  }
}

resource "aws_lb_listener" "listener" {
  load_balancer_arn = aws_alb.application_load_balancer.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.target_group.arn
  }
}