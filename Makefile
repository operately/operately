SHELL := /bin/bash

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

REPORTS_DIR ?= $(PWD)/testreports

# If you want to run the tests that generate screenshots, you need to
# set the SCREENSHOTS_DIR environment variable to a directory where
# the screenshots will be saved.
#
# If the directory does not exist, it will be created automatically
# in the root of the project.
#
# For vagrant users, add the following line to your .bashrc/.zshrc file to
# be albe to access the screenshots from your host machine:
#
#   export SCREENSHOTS_DIR=/vagrant/screenshots
#
SCREENSHOTS_DIR ?= $(PWD)/screenshots

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
DOCKER_COMPOSE = docker compose --progress plain run --rm -v $(SCREENSHOTS_DIR):/tmp/screenshots

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
	$(USER_CONTEXT) && docker compose --progress plain build
	$(MAKE) dev.setup

migrate:
	$(MAKE) dev.db.migrate
	$(MAKE) test.db.migrate

dev.setup:
	$(DEV_CONTAINER) mix deps.get
	$(DEV_CONTAINER) mix compile

test.setup:
	./devenv mix deps.get
	./devenv bash -c "MIX_ENV=test mix deps.compile"
	./devenv bash -c "MIX_ENV=test cd assets && npm install"
	./devenv bash -c "MIX_ENV=test mix assets.deploy"

test.seed.env:
	touch .env
	echo 'OPERATELY_BLOB_TOKEN_SECRET_KEY="lPEuB9ITpbHP1GTf98TPWcHb/CrdeNLzqLcm0zF5mfo="' >> .env

#
# Generate code
#
gen:
	@rm -f lib/operately_web/graphql/schema.ex
	@$(DEV_CONTAINER) bash -c "mix operately.gen.elixir.graphql.schema && \
		                         mix operately.gen.typescript.graphql.schema && \
		                         mix operately.gen.notification.items.index && \
		                         mix operately.gen.feed.items.index && \
		                         mix operately.gen.page.index"

gen.migration:
	$(DEV_CONTAINER) mix ecto.gen.migration $(NAME)

gen.page:
	$(DEV_CONTAINER) mix operately.gen.page $(NAME)
	$(MAKE) gen

gen.activity:
	$(DEV_CONTAINER) mix operately.gen.activity.type $(NAME) $(FIELDS)
	$(MAKE) gen

#
# Development tasks
#

dev.server:
	$(DEV_CONTAINER_WITH_PORTS) iex -S mix phx.server

dev.shell:
	$(DEV_CONTAINER) bash

dev.mix.task:
	$(DEV_CONTAINER) mix $(TASK)

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

dev.db.seed:
	$(DEV_CONTAINER) mix run priv/repo/seeds.exs

dev.run.script:
	cp -f $(FILE) tmp/
	$(DEV_CONTAINER) mix run tmp/$$(basename $(FILE))

dev.image.build:
	docker build -f Dockerfile.dev.base -t operately/dev-image:latest .

dev.image.push:
	docker push operately/dev-image:latest

#
# Testing tasks
#

test: test.init
	@if [[ "$(FILE)" == assets/js* ]]; then \
		$(MAKE) test.npm FILE=$(FILE); \
	elif [[ "$(FILE)" == test/* ]]; then \
		$(MAKE) test.mix FILE=$(FILE); \
	else \
		$(MAKE) test.all; \
	fi

test.init:
	@mkdir -p $(SCREENSHOTS_DIR)
	@mkdir -p $(REPORTS_DIR)

test.all: test.init
	$(MAKE) test.mix && $(MAKE) test.npm

test.mix: test.init
	./devenv mix test $(FILE)

test.mix.unit: test.init
	./devenv mix test $$(find test -name "*_test.exs" | grep -v "test/features")

test.mix.features: test.init
	./devenv mix test $$(find test -name "*_test.exs" | grep "test/features" | ./scripts/split.rb $(INDEX) $(TOTAL))

test.npm: test.init
	./devenv bash -c "cd assets && npm test"

test.db.migrate:
	./devenv mix ecto.migrate

test.watch: test.init
	./devenv mix test.watch $(FILE)

test.db.create:
	./devenv mix ecto.create

test.db.reset:
	./devenv mix ecto.reset

test.assets.compile:
	./devenv mix assets.build

test.screenshots.clear:
	rm -rf $(SCREENSHOTS_DIR)/*

test.license.check:
	bundle install
	bash scripts/license-check.sh

test.js.dead.code:
	./devenv bash -c "cd assets && npm --no-update-notifier run knip"

test.tsc.lint:
	./devenv bash -c "scripts/tsc_lint.sh"

#
# Building a docker image
#

DOCKER_IMAGE_TAG = $(shell git rev-parse --short HEAD)

docker.build:
	docker build -f Dockerfile.prod -t operately/operately:latest -t operately/operately:$(DOCKER_IMAGE_TAG) .

docker.push:
	docker push operately/operately:$(DOCKER_IMAGE_TAG)
	docker push operately/operately:latest

