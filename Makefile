SHELL := /bin/bash  # Use bash syntax
MAKEFLAGS += -s     # Silent mode

.PHONY: test

REPORTS_DIR ?= $(PWD)/testreports
MEDIA_DIR ?= $(PWD)/media
SCREENSHOTS_DIR ?= $(PWD)/screenshots
CERTS_DIR ?= $(PWD)/tmp/certs

#
# Tasks for generating code
#

gen:
	./devenv bash -c "mix operately.gen.page.index && mix operately.gen.typescript.api"
	./devenv bash -c "npx prettier --write assets/js/api && npx prettier --write assets/js/pages/index.tsx && npx prettier --write ee/assets/js/admin_api/index.tsx"

gen.migration:
	./devenv mix ecto.gen.migration $(NAME)

gen.page:
	./devenv mix operately.gen.page $(NAME) && $(MAKE) gen

gen.operation:
	./devenv bash -c "ERL_FLAGS=+B mix operately.gen.operation"

js.fmt.fix:
	./devenv bash -c "npx prettier --write js"


#
# Development tasks
#

dev.build:
	$(MAKE) dev.seed.env
	./devenv up
	./devenv mix local.hex --force --if-missing
	./devenv mix deps.get
	./devenv mix compile
	./devenv npm install
	$(MAKE) dev.db.create
	$(MAKE) test.db.create
	$(MAKE) dev.db.migrate
	$(MAKE) test.db.migrate

dev.server:
	./devenv iex -S mix phx.server

dev.shell:
	./devenv shell

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

dev.seed.env:
	touch .env

dev.mix.deps.clean:
	./devenv mix deps.clean --unlock --unused

dev.teardown:
	./devenv bash -c "MIX_ENV=dev mix ecto.drop"
	./devenv bash -c "MIX_ENV=test mix ecto.drop"
	./devenv down

#
# Testing tasks
#

test.build:
	$(MAKE) test.init
	$(MAKE) test.seed.env
	./devenv up
	./devenv bash -c "MIX_ENV=test mix local.hex --force --if-missing"
	./devenv bash -c "MIX_ENV=test mix deps.get"
	./devenv bash -c "MIX_ENV=test mix compile"
	./devenv bash -c "MIX_ENV=test npm install"
	./devenv bash -c "MIX_ENV=test mix assets.deploy"
	$(MAKE) test.db.create
	$(MAKE) test.db.migrate

test: test.init
	@if [[ "$(FILE)" == assets/js* ]]; then \
		$(MAKE) test.npm FILE=$(FILE); \
	elif [[ "$(FILE)" == test/* ]]; then \
		./devenv mix test $(FILE); \
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
	./devenv npm test

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
	./devenv bash -c "npm --no-update-notifier run knip"

test.tsc.lint:
	./devenv bash -c "npx tsc --noEmit -p ."

test.pr.name:
	ruby scripts/pr-name-check

test.js.fmt.check:
	./devenv bash "./scripts/prettier-check.sh"

test.seed.env:
	touch .env
	echo 'OPERATELY_BLOB_TOKEN_SECRET_KEY="lPEuB9ITpbHP1GTf98TPWcHb/CrdeNLzqLcm0zF5mfo="' >> .env

test.elixir.warnings:
	./devenv bash -c "MIX_ENV=test mix compile --warnings-as-errors --all-warnings"


#
# Building a docker image
#

DOCKER_IMAGE_TAG = $(shell git rev-parse --short HEAD)

docker.build:
	docker build -f Dockerfile.prod -t operately/operately:latest -t operately/operately:$(DOCKER_IMAGE_TAG) .

docker.push:
	docker push operately/operately:$(DOCKER_IMAGE_TAG)
	docker push operately/operately:latest

#
# Release related tasks
#

release.tag.docker:
	docker pull operately/operately:$(DOCKER_IMAGE_TAG)
	docker tag operately/operately:$(DOCKER_IMAGE_TAG) operately/operately:$(VERSION)
	docker push operately/operately:$(VERSION)

release.build.singlehost:
	elixir rel/single-host/build.exs $(VERSION)

release.push.github.release:
	elixir rel/make-github-release.exs $(VERSION)
