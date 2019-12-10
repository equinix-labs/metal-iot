terraform {
  backend "remote" {
    organization = "metamora"
    workspaces {
      prefix = "packet-labs-iot-"
    }
  }
}
