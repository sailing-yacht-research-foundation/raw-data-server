resource "aws_ecs_cluster" "rds_cluster" {
  name = "Raw-Data-Server-ECS_Cluster"
}

resource "random_password" "raw_data_server_db_password" {
  length           = 12
  special          = true
  override_special = "_%@"
}

resource "aws_cloudwatch_log_group" "rds_cw_log_group" {
  name = "RawDataServer-log"

  retention_in_days = 7

  lifecycle {
    create_before_destroy = true
    prevent_destroy       = false
  }
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
    container_port   = var.app_container_port
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.target_group_db.arn
    container_name   = "rds-db"
    container_port   = 3306
  }

  network_configuration {
    subnets          = aws_default_subnet.default_subnet.*.id
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
          "containerPort": ${var.app_container_port},
          "hostPort": 3000
        }
      ],
      "environment": [
        { "name": "DB_HOST", "value": "localhost" },
        { "name": "DB_USER", "value": "${var.db_username}" },
        { "name": "DB_PASSWORD", "value": "${random_password.raw_data_server_db_password.result}" },
        { "name": "DB_NAME", "value": "${var.db_name}" },
        { "name": "AWS_S3_ACCESS_KEY_ID", "value": "${var.s3_access_key_id}" },
        { "name": "AWS_S3_SECRET_ACCESS_KEY", "value": "${var.s3_secret_key}" },
        { "name": "AWS_S3_BUCKET", "value": "${var.s3_bucket}" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "${aws_cloudwatch_log_group.rds_cw_log_group.id}",
          "awslogs-region": "${var.aws_region}",
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
        { "name": "MYSQL_DATABASE", "value": "${var.db_name}" },
        { "name": "MYSQL_USER", "value": "${var.db_username}" },
        { "name": "MYSQL_PASSWORD", "value": "${random_password.raw_data_server_db_password.result}" },
        { "name": "MYSQL_ROOT_PASSWORD", "value": "${random_password.raw_data_server_db_password.result}" }
      ],
      "command": ["--max_allowed_packet=32505856"],
      "memory": 256,
      "cpu": 128,
      "mountPoints": [
          {
              "containerPath": "/var/lib/mysql",
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
      root_directory          = "/db"
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

  ingress {
    from_port   = 3306
    to_port     = 3306
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
