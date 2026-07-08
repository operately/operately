SHELL := /bin/bash  # Use bash syntax
MAKEFLAGS += -s     # Silent mode

.PHONY: test cli.build cli.test cli.test.unit cli.test.e2e mcp.test.e2e app.node_modules turboui.node_modules cli.node_modules

REPORTS_DIR ?= $(PWD)/app/testreports
SCREENSHOTS_DIR ?= $(PWD)/app/screenshots
MEDIA_DIR ?= $(PWD)/media
CERTS_DIR ?= $(PWD)/tmp/certs

#
# Tasks for generating code
#

gen:
	./devenv bash -c "cd app && mix operately.gen.page.index && mix operately.gen.typescript.api && mix operately.gen.turboui.api_types"
	./devenv bash -c "cd app && npx prettier --write assets/js/api && npx prettier --write assets/js/pages/index.tsx && npx prettier --write ee/assets/js/admin_api/index.tsx && npx prettier --write ../turboui/src/ApiTypes/index.ts"

gen.api.docs:
	./devenv bash -c "cd app && mix operately.gen.api.docs"

gen.api.catalog:
	./devenv bash -c "cd app && MIX_ENV=$${MIX_ENV:-dev} mix operately.gen.api.catalog"

gen.api.docs.ci:
	$(MAKE) test.up
	./devenv bash -c "cd app && mix local.hex --force --if-missing && mix local.rebar --force --if-missing"
	./devenv bash -c "cd app && mix deps.get"
	$(MAKE) gen.api.docs

gen.migration:
	./devenv bash -c "cd app && mix ecto.gen.migration $(NAME)"

gen.page:
	./devenv bash -c "cd app && mix operately.gen.page $(NAME)"
	$(MAKE) gen

gen.activity:
	./devenv bash -c "cd app && ERL_FLAGS=+B mix operately.gen.activity"

gen.activity.email:
	./devenv bash -c "cd app && ERL_FLAGS=+B mix operately.gen.activity.email $(ACTIVITY_NAME)"

js.fmt.fix:
	./devenv bash -c "cd app && npx prettier --write assets/js && npx prettier --write ee/assets/js"

migrate:
	$(MAKE) dev.db.migrate
	$(MAKE) test.db.migrate

devimage.build:
	docker buildx build --platform linux/amd64,linux/arm64 -f docker/dev/Dockerfile.dev -t operately/operately-dev:latest docker/dev --push

#
# Development tasks
#

dev.up:
	$(MAKE) dev.seed.env
	./devenv up

app.node_modules:
	./devenv bash -c "./scripts/ensure_node_modules.sh app app"

turboui.node_modules:
	./devenv bash -c "./scripts/ensure_node_modules.sh turboui turboui"

cli.node_modules:
	./scripts/ensure_node_modules.sh cli cli

dev.build:
	$(MAKE) dev.up
	./devenv bash -c "cd app && mix local.hex --force --if-missing"
	./devenv bash -c "cd app && mix deps.get"
	./devenv bash -c "cd app && mix compile"
	$(MAKE) app.node_modules
	$(MAKE) turboui.build
	$(MAKE) dev.db.create
	$(MAKE) test.db.create
	$(MAKE) dev.db.migrate
	$(MAKE) test.db.migrate

dev.server:
	./devenv bash -c "scripts/kill_vite_servers.sh" # prevent multiple vite servers running
	./devenv bash -c "cd app && iex -S mix phx.server"

turboui.storybook:
	$(MAKE) turboui.node_modules
	./devenv bash -c "cd turboui && npm run storybook"

turboui.build:
	@rm -rf turboui/dist
	$(MAKE) turboui.node_modules
	./devenv bash -c "cd turboui && npm run build"

turboui.test:
	$(MAKE) turboui.node_modules
	./devenv bash -c "cd turboui && npm run test"

cli.build:
	$(MAKE) cli.node_modules
	./devenv bash -c "cd cli && npm run build"

cli.test: cli.test.unit

cli.test.unit:
	$(MAKE) cli.node_modules
	npm --prefix cli test

cli.test.e2e: test.init
	./devenv bash -c "cd app && mix test test/cli_e2e"

mcp.test.e2e: test.init
	./devenv bash -c "cd app && mix test test/mcp_e2e"

gen.cli.catalog:
	$(MAKE) gen.api.catalog
	$(MAKE) cli.node_modules
	./devenv bash -c "cd cli && npm run gen:commands"

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

dev.db.export.schema:
	./devenv bash -c "./scripts/db_export_schema.sh"
	cat tmp/schema.sql | pbcopy
	echo "Database schema exported to tmp/schema.sql and copied to clipboard."

dev.run.script:
	cp -f $(FILE) tmp/
	./devenv bash -c "cd app && mix run tmp/$$(basename $(FILE))"

dev.seed.env:
	@touch .env
	@mkdir -p tmp/certs
	@grep "OPERATELY_BLOB_TOKEN_SECRET_KEY" .env >/dev/null || echo "OPERATELY_BLOB_TOKEN_SECRET_KEY=$$(openssl rand -base64 32)" >> .env
	@grep "ALLOW_LOGIN_WITH_EMAIL" .env >/dev/null || printf "\nALLOW_LOGIN_WITH_EMAIL=yes\n" >> .env
	@grep "ALLOW_SIGNUP_WITH_EMAIL" .env >/dev/null || echo "ALLOW_SIGNUP_WITH_EMAIL=yes" >> .env

dev.mix.deps.clean:
	./devenv bash -c "cd app && mix deps.clean --unlock --unused"

dev.teardown:
	./devenv teardown

#
# Testing tasks
#


test.build:
	$(MAKE) test.up
	$(MAKE) test.turboui.build
	$(MAKE) test.app.build
	$(MAKE) test.db.create
	$(MAKE) test.db.migrate

test.setup.turboui:
	$(MAKE) test.up

test.setup.lint:
	$(MAKE) test.up
	$(MAKE) test.app.elixir.build
	$(MAKE) test.app.node_modules
	$(MAKE) test.turboui.node_modules

test.setup.dialyzer:
	$(MAKE) test.up
	$(MAKE) test.app.elixir.build

test.setup.unit:
	$(MAKE) test.up
	$(MAKE) test.app.elixir.build
	$(MAKE) test.app.js.build
	$(MAKE) test.db.create
	$(MAKE) test.db.migrate

test.setup.ee:
	$(MAKE) test.setup.unit

test.setup.js:
	$(MAKE) test.up
	$(MAKE) test.app.node_modules
	$(MAKE) test.turboui.node_modules

test.setup.features:
	$(MAKE) test.build

test.setup.cli_e2e:
	$(MAKE) test.build
	$(MAKE) cli.build

test.setup.mcp_e2e:
	$(MAKE) test.setup.unit

test.up:
	$(MAKE) test.init
	$(MAKE) test.seed.env
	@for i in 1 2 3; do \
		echo "Attempt $$i: Starting devenv..."; \
		if ./devenv up; then \
			echo "devenv up succeeded on attempt $$i"; \
			break; \
		else \
			echo "devenv up failed on attempt $$i"; \
			if [ $$i -lt 3 ]; then \
				echo "Waiting 10 seconds before retry..."; \
				sleep 10; \
			else \
				echo "All attempts failed"; \
				exit 1; \
			fi; \
		fi; \
	done

test.turboui.node_modules:
	$(MAKE) turboui.node_modules

test.turboui.build:
	$(MAKE) test.turboui.node_modules
	./devenv bash -c "cd turboui && MIX_ENV=test npm run build"

test.app.build:
	$(MAKE) test.app.elixir.build
	$(MAKE) test.app.js.build

test.app.elixir.build:
	./devenv bash -c "cd app && MIX_ENV=test mix local.hex --force --if-missing"
	./devenv bash -c "cd app && MIX_ENV=test mix deps.get"
	./devenv bash -c "cd app && MIX_ENV=test mix compile"

test.app.node_modules:
	$(MAKE) app.node_modules

test.app.js.build:
	$(MAKE) test.app.node_modules
	$(MAKE) test.turboui.node_modules
	./devenv bash -c "cd app && MIX_ENV=test npm run build"
	./devenv bash -c "cd app && MIX_ENV=test mix assets.deploy"

test: test.init
	@if [[ "$(FILE)" == assets/js* ]]; then \
		$(MAKE) test.npm FILE=$(FILE); \
	elif [[ "$(FILE)" == test/* ]] || [[ "$(FILE)" == ee/test/* ]] || [[ "$(FILE)" == app/test/* ]] || [[ "$(FILE)" == app/ee/test/* ]]; then \
		./devenv bash -c "cd app && mix test $$(echo $(FILE) | sed 's|^app/||')"; \
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
	./devenv bash -c "./scripts/run_ee_tests.js"

test.mix.unit: test.init
	./devenv bash -c "./scripts/run_unit_tests.js $(INDEX) $(TOTAL)"

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

test.dialyzer:
	./devenv bash -c "cd app && MIX_ENV=test mix dialyzer"

test.tsc.lint:
	./devenv bash -c "cd app && npx tsc --noEmit -p tsconfig.lint.json"

test.cli.catalog.sync:
	./devenv bash -c 'cd app && MIX_ENV=test mix run --no-compile --no-start -e "Mix.Tasks.Operately.Gen.Api.Catalog.run([])"'
	$(MAKE) cli.node_modules
	./devenv bash -c "cd cli && npm run check:catalog"

test.pr.name:
	ruby scripts/pr-name-check

test.js.fmt.check:
	./devenv bash -c "./scripts/prettier-check.sh"

test.seed.env:
	touch .env
	echo 'OPERATELY_BLOB_TOKEN_SECRET_KEY="lPEuB9ITpbHP1GTf98TPWcHb/CrdeNLzqLcm0zF5mfo="' >> .env
	echo 'CI=$(CI)' >> .env

test.elixir.warnings:
	./devenv bash -c "cd app && MIX_ENV=test mix compile --warnings-as-errors --all-warnings"

test.icons.check:
	bash scripts/icon-linting.sh


#
# Building a docker image
#

DOCKER_IMAGE_TAG = $(shell git rev-parse --short HEAD)

inject.rel.version:
	sed -i -E 's/dev-version/$(shell date +%Y-%m-%d)-$(DOCKER_IMAGE_TAG)/g' app/lib/operately.ex

docker.build:
	$(MAKE) inject.rel.version
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
	elixir app/rel/single-host/build.exs $(VERSION)

release.push.github.release:
	elixir app/rel/make-github-release.exs $(VERSION)
