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

  #load_balancer {
  #  target_group_arn = aws_lb_target_group.target_group_db.arn
  #  container_name   = "rds-db"
  #  container_port   = 3306
  #}

  network_configuration {
    subnets          = aws_subnet.public_subnet.*.id
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
        { "name": "NODE_OPTIONS", "value": "--max_old_space_size=12288" }
      ],
      "environmentFiles": [
               {
                   "value": "arn:aws:s3:::syrf-dev-env-variables/raw-data-server.env",
                   "type": "s3"
               }
           ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "${aws_cloudwatch_log_group.rds_cw_log_group.id}",
          "awslogs-region": "${var.aws_region}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "memory": 14336,
      "cpu": 4096
    }

  ]
  DEFINITION
  requires_compatibilities = ["FARGATE"] # Stating that we are #using ECS Fargate
  network_mode             = "awsvpc"    # Using awsvpc as our network mode as this is required for Fargate
  memory                   = 14336       # Specifying the memory our container requires
  cpu                      = 4096        # Specifying the CPU our container requires
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

resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 2
  min_capacity       = 1
  resource_id        = "service/Raw-Data-Server-ECS_Cluster/Raw-Data-Server-Service"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}


resource "aws_appautoscaling_policy" "ecs_target_cpu" {
  name               = "application-scaling-policy-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 80
  }
  depends_on = [aws_appautoscaling_target.ecs_target]
}

resource "aws_appautoscaling_policy" "ecs_target_memory" {
  name               = "application-scaling-policy-memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80
  }
  depends_on = [aws_appautoscaling_target.ecs_target]
}

resource "aws_security_group" "service_security_group" {
  vpc_id = aws_vpc.syrf-vpc.id


  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    # Only allowing traffic in from the load balancer security #group
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

  ingress {
    from_port   = 61613
    to_port     = 61613
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
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
