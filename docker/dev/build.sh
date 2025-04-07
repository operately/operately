#!/usr/bin/env bash

DOCKER_USER=1000
DOCKER_GROUP=1000

if [[ $(uname -s) == "Linux" ]]; then
  DOCKER_USER=$(id -u)
  DOCKER_GROUP=$(id -g)
fi

docker build --build-arg USER_ID=$DOCKER_USER --build-arg GROUP_ID=$DOCKER_GROUP -f docker/dev/Dockerfile.dev -t operately-dev:latest docker/dev
