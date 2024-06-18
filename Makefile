SHELL := /bin/bash

.PHONY: test

REPORTS_DIR ?= $(PWD)/testreports
MEDIA_DIR ?= $(PWD)/media
SCREENSHOTS_DIR ?= $(PWD)/screenshots
CERTS_DIR ?= $(PWD)/tmp/certs

build:
	@touch .env
	./devenv build

up:
	./devenv up

setup:
	./devenv mix local.hex --force --if-missing
	$(MAKE) dev.setup
	$(MAKE) test.setup

migrate:
	$(MAKE) dev.db.migrate
	$(MAKE) test.db.migrate

dev.setup:
	./devenv mix deps.get
	./devenv mix compile

test.setup:
	./devenv mix deps.get
	./devenv bash -c "MIX_ENV=test mix deps.compile"
	./devenv bash -c "MIX_ENV=test cd assets && npm install"
	./devenv bash -c "MIX_ENV=test mix assets.deploy"

test.seed.env:
	touch .env
	echo 'OPERATELY_BLOB_TOKEN_SECRET_KEY="lPEuB9ITpbHP1GTf98TPWcHb/CrdeNLzqLcm0zF5mfo="' >> .env

gen:
	@rm -f lib/operately_web/graphql/schema.ex
	@./devenv mix operately.gen.elixir.graphql.schema
	@./devenv mix operately.gen.typescript.graphql.schema
	@./devenv mix operately.gen.page.index
	@./devenv mix operately.gen.typescript.api

gen.migration:
	./devenv mix ecto.gen.migration $(NAME)

gen.page:
	./devenv mix operately.gen.page $(NAME)
	$(MAKE) gen

gen.activity:
	./devenv mix operately.gen.activity.type $(NAME) $(FIELDS)
	$(MAKE) gen


#
# Development tasks
#

dev.server:
	./devenv iex -S mix phx.server

dev.shell:
	./devenv shell

dev.up:
	./devenv up

dev.mix.console:
	./devenv iex -S mix

dev.mix.task:
	./devenv mix $(TASK)

dev.db.create:
	./devenv mix ecto.create

dev.db.migrate:
	./devenv bash -c "MIX_ENV=dev mix ecto.migrate"

dev.db.rollback:
	./devenv mix ecto.rollback

dev.db.reset:
	./devenv mix ecto.reset

dev.db.seed:
	./devenv mix run priv/repo/seeds.exs

dev.run.script:
	cp -f $(FILE) tmp/
	./devenv mix run tmp/$$(basename $(FILE))

dev.create.account:
	./devenv mix operately.create.account "$(EMAIL)" "$(PASSWORD)"

dev.create.company:
	./devenv mix operately.create.company "$(NAME)"

dev.add.account.to.company:
	./devenv mix operately.add.account.to.company "$(ACCOUNT_EMAIL)" "$(COMPANY_NAME)" "$(NAME)" "$(ROLE)"

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
	@mkdir -p $(MEDIA_DIR)
	@mkdir -p $(CERTS_DIR)

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
	./devenv bash -c "MIX_ENV=test mix ecto.migrate"

test.watch: test.init
	./devenv mix test.watch $(FILE)

test.db.create:
	./devenv bash -c "MIX_ENV=test mix ecto.create"

test.db.reset:
	./devenv bash -c "MIX_ENV=test mix ecto.reset"

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
	./devenv bash -c "cd assets && npx tsc --noEmit -p ."

#
# Building a docker image
#

DOCKER_IMAGE_TAG = $(shell git rev-parse --short HEAD)

docker.build:
	docker build -f Dockerfile.prod -t operately/operately:latest -t operately/operately:$(DOCKER_IMAGE_TAG) .

docker.push:
	docker push operately/operately:$(DOCKER_IMAGE_TAG)
	docker push operately/operately:latest
