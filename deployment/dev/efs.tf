resource "aws_efs_file_system" "rds_fs" {
  creation_token = "rds_fs"

  tags = {
    Name = "EFS-RawDataServer"
  }
}

resource "aws_efs_mount_target" "mount" {
  count          = length(var.aws_availability_zones)
  file_system_id = aws_efs_file_system.rds_fs.id
  subnet_id      = aws_subnet.public_subnet[count.index].id

  security_groups = [aws_security_group.service_security_group.id]
}


resource "aws_efs_access_point" "rds_eap" {
  file_system_id = aws_efs_file_system.rds_fs.id
}