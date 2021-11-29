resource "aws_ecr_repository" "raw_data_server_ecr_repo" {
  name = "raw-data-server"
}

data "aws_ecr_image" "raw_data_service" {
  repository_name = "raw-data-server"
  image_tag       = "v0.0.6"
}