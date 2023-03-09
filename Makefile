#
# Where to start with the project?
#
# Start by running the 'make setup' command to install all the dependencies.
# Then run 'make dev.server' to start the development server.
# Run 'make test' to run the tests.

# About PHONY:
#
# Make, by default, builds files and folders in the current directory
# and skip files and folders that already exist.
#
# To mark a target as a "not real file" or "not real folder" but instead
# a command to be executed, we mark it as a "phony" (not real) file or folder.
#
# This is the case for the test directory.
#
.PHONY: test

#
# Use the same user id and group id as the host user
# to avoid permission issues with the mounted volume
# when running the container.
#
# See https://docs.docker.com/engine/security/userns-remap/
# for more information.
USER_CONTEXT = export GROUP_ID=$$(id -g) && export USER_ID=$$(id -u)

#
# Prepare a command to run the container.
#
# We use --service-ports to expose the ports of the container to the host.
# We use --rm to remove the container after it has been stopped.
#
# Note: docker-compose is not the same thing as "docker compose".
# The latter is a new command that part of the latest version of Docker.
#
# "docker compose" is a full rewrite of the "docker-compose" tool from Python to Go,
# which brings a lot of improvements like a better UX and a better performance.
# Most importantly, it is able to seemlesly use ARM images on ARM machines, and
# AMD64 images on AMD64 machines.
#
DOCKER_COMPOSE = docker compose run --rm -v /vagrant/screenshots:/tmp/screenshots

#
# Prepare commands to run the containers in various modes.
# For development tasks use the DEV_CONTAINER.
# For testing tasks use the TEST_CONTAINER.
#
DEV_CONTAINER = $(USER_CONTEXT) && $(DOCKER_COMPOSE) -e MIX_ENV=dev app
TEST_CONTAINER = $(USER_CONTEXT) && $(DOCKER_COMPOSE) -e MIX_ENV=test app

DEV_CONTAINER_WITH_PORTS = $(USER_CONTEXT) && $(DOCKER_COMPOSE) --service-ports -e MIX_ENV=dev app

#
# This is the first command that you should run when you start working on the project.
# It will build the container and install all dependencies.
#
setup:
	$(USER_CONTEXT) && docker compose build
	$(DEV_CONTAINER) mix deps.get
	$(DEV_CONTAINER) mix deps.compile

#
# Development tasks
#

dev.server:
	$(DEV_CONTAINER_WITH_PORTS) mix phx.server

dev.shell:
	$(DEV_CONTAINER) bash

dev.console:
	$(DEV_CONTAINER) iex -S mix phx.server

dev.db.create:
	$(DEV_CONTAINER) mix ecto.create

dev.db.migrate:
	$(DEV_CONTAINER) mix ecto.migrate

dev.db.rollback:
	$(DEV_CONTAINER) mix ecto.rollback

dev.db.reset:
	$(DEV_CONTAINER) mix ecto.reset

#
# Testing tasks
#

test:
	$(TEST_CONTAINER) mix test $(FILE)

test.watch:
	$(TEST_CONTAINER) mix test.watch $(FILE)

test.db.create:
	$(TEST_CONTAINER) mix ecto.create
