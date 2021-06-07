resource "aws_ecs_cluster" "rds_cluster" {
  name = "Raw-Data-Server-ECS_Cluster"
}

resource "aws_ecs_service" "rds_service" {
  name            = "Raw-Data-Server-Service"
  cluster         = aws_ecs_cluster.rds_cluster.id
  task_definition = aws_ecs_task_definition.rds_task.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.target_group.arn
    container_name   = aws_ecs_task_definition.rds_task.family
    container_port   = 3000
  }

  network_configuration {
    subnets          = [aws_default_subnet.default_subnet_1.id, aws_default_subnet.default_subnet_2.id]
    assign_public_ip = true
    security_groups  = [aws_security_group.service_security_group.id]
  }
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

resource "aws_security_group" "service_security_group" {
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    # Only allowing traffic in from the load balancer security group
    security_groups = [aws_security_group.load_balancer_security_group.id]
  }

  ingress {
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_iam_role" "ecsTaskExecutionRole" {
  name               = "ecsTaskExecutionRole-RawDataServer"
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