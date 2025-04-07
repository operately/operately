SHELL := /bin/bash  # Use bash syntax
MAKEFLAGS += -s     # Silent mode

.PHONY: test

REPORTS_DIR ?= $(PWD)/app/testreports
SCREENSHOTS_DIR ?= $(PWD)/app/screenshots
MEDIA_DIR ?= $(PWD)/media
CERTS_DIR ?= $(PWD)/tmp/certs

#
# Tasks for generating code
#

gen:
	./devenv bash -c "cd app && mix operately.gen.page.index && mix operately.gen.typescript.api"
	./devenv bash -c "cd app && npx prettier --write assets/js/api && npx prettier --write assets/js/pages/index.tsx && npx prettier --write ee/assets/js/admin_api/index.tsx"

gen.migration:
	./devenv bash -c "cd app && mix ecto.gen.migration $(NAME)"

gen.page:
	./devenv bash -c "cd app && mix operately.gen.page $(NAME) && $(MAKE) gen"

gen.operation:
	./devenv bash -c "cd app && ERL_FLAGS=+B mix operately.gen.operation"

js.fmt.fix:
	./devenv bash -c "cd app && npx prettier --write assets/js && npx prettier --write ee/assets/js"

migrate:
	$(MAKE) dev.db.migrate
	$(MAKE) test.db.migrate

build.docker.dev:
	bash docker/dev/build.sh

#
# Development tasks
#

dev.build:
	$(MAKE) build.docker.dev
	$(MAKE) dev.seed.env
	./devenv up
	./devenv bash -c "cd app && mix local.hex --force --if-missing"
	./devenv bash -c "cd app && mix deps.get"
	./devenv bash -c "cd app && mix compile"
	./devenv bash -c "cd app && npm install"
	$(MAKE) dev.db.create
	$(MAKE) test.db.create
	$(MAKE) dev.db.migrate
	$(MAKE) test.db.migrate

dev.server:
	./devenv bash -c "cd app && iex -S mix phx.server"

design.server:
	./devenv bash -c "cd design && npm install && npm run dev"

dev.shell:
	./devenv shell

dev.mix.console:
	./devenv bash -c "cd app && iex -S mix"

dev.mix.task:
	./devenv bash -c "cd app && mix $(TASK)"

dev.db.create:
	./devenv bash -c "cd app && mix ecto.create"

dev.db.migrate:
	./devenv bash -c "cd app && MIX_ENV=dev mix ecto.migrate"

dev.db.rollback:
	./devenv bash -c "cd app && mix ecto.rollback"

dev.db.reset:
	./devenv bash -c "cd app && mix ecto.reset"

dev.db.seed:
	./devenv bash -c "cd app && mix run priv/repo/seeds.exs"

dev.run.script:
	cp -f $(FILE) tmp/
	./devenv bash -c "cd app && mix run tmp/$$(basename $(FILE))"

dev.seed.env:
	touch .env
	mkdir -p tmp/certs
	grep "OPERATELY_BLOB_TOKEN_SECRET_KEY" .env || echo "OPERATELY_BLOB_TOKEN_SECRET_KEY=$$(openssl rand -base64 32)" >> .env
	grep "ALLOW_LOGIN_WITH_EMAIL" .env || printf "\nALLOW_LOGIN_WITH_EMAIL=yes\n" >> .env
	grep "ALLOW_SIGNUP_WITH_EMAIL" .env || echo "ALLOW_SIGNUP_WITH_EMAIL=yes" >> .env

dev.mix.deps.clean:
	./devenv bash -c "cd app && mix deps.clean --unlock --unused"

dev.teardown:
	./devenv bash -c "cd app && MIX_ENV=dev mix ecto.drop"
	./devenv bash -c "cd app && MIX_ENV=test mix ecto.drop"
	./devenv down

#
# Testing tasks
#


test.build:
	$(MAKE) build.docker.dev
	$(MAKE) test.init
	$(MAKE) test.seed.env
	$(MAKE) test.up
	$(MAKE) test.turboui.build
	$(MAKE) test.app.build
	$(MAKE) test.db.create
	$(MAKE) test.db.migrate

test.up:
	./devenv up

test.turboui.build:
	./devenv bash -c "cd turboui && npm install"
	./devenv bash -c "cd turboui && MIX_ENV=test npm run build"

test.app.build:
	./devenv bash -c "cd app && MIX_ENV=test mix local.hex --force --if-missing"
	./devenv bash -c "cd app && MIX_ENV=test mix deps.get"
	./devenv bash -c "cd app && MIX_ENV=test mix compile"
	./devenv bash -c "cd app && MIX_ENV=test npm install"
	./devenv bash -c "cd app && MIX_ENV=test npm run build"
	./devenv bash -c "cd app && MIX_ENV=test mix assets.deploy"

test: test.init
	@if [[ "$(FILE)" == assets/js* ]]; then \
		$(MAKE) test.npm FILE=$(FILE); \
	elif [[ "$(FILE)" == test/* ]] || [[ "$(FILE)" == ee/test/* ]]; then \
		./devenv bash -c "cd app && mix test $(FILE)"; \
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
	./devenv bash -c "cd app && mix test $(FILE)"

test.ee:
	./devenv bash -c "cd app && mix test ee/test/**/*_test.exs"

test.mix.unit: test.init
	./devenv bash -c "./scripts/run_unit_tests.js"

test.mix.features: test.init
	./devenv bash -c "./scripts/run_feature_tests.js $(INDEX) $(TOTAL)"

test.npm: test.init
	./devenv bash -c "cd app && npx jest $(shell echo $(FILE) | cut -d':' -f1)"

test.db.migrate:
	./devenv bash -c "cd app && MIX_ENV=test mix ecto.migrate"

test.watch: test.init
	./devenv bash -c "cd app && mix test.watch $(FILE)"

test.db.create:
	./devenv bash -c "cd app && MIX_ENV=test mix ecto.create"

test.db.reset:
	./devenv bash -c "cd app && MIX_ENV=test mix ecto.reset"

test.assets.compile:
	./devenv bash -c "cd app && mix assets.build"

test.screenshots.clear:
	rm -rf $(SCREENSHOTS_DIR)/*

test.license.check:
	bash scripts/license-check.sh

test.js.dead.code:
	./devenv bash -c "cd app && npm --no-update-notifier run knip"

test.tsc.lint:
	./devenv bash -c "cd app && npx tsc --noEmit -p ."

test.pr.name:
	ruby scripts/pr-name-check

test.js.fmt.check:
	./devenv bash -c "./scripts/prettier-check.sh"

test.seed.env:
	touch .env
	echo 'OPERATELY_BLOB_TOKEN_SECRET_KEY="lPEuB9ITpbHP1GTf98TPWcHb/CrdeNLzqLcm0zF5mfo="' >> .env

test.elixir.warnings:
	./devenv bash -c "cd app && MIX_ENV=test mix compile --warnings-as-errors --all-warnings"


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
