resource "aws_lb" "network_load_balancer" {
  name               = "Raw-Data-Server-NLB"
  load_balancer_type = "network"
  subnets            = aws_default_subnet.default_subnet.*.id
}


resource "aws_lb_target_group" "target_group_db" {
  name        = "target-group-db"
  port        = 3306
  protocol    = "TCP"
  target_type = "ip"
  vpc_id      = aws_default_vpc.default_vpc.id
}

resource "aws_lb_listener" "listener_db" {
  load_balancer_arn = aws_lb.network_load_balancer.arn
  port              = "3306"
  protocol          = "TCP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.target_group_db.arn
  }
}