SHELL := /bin/bash  # Use bash syntax
MAKEFLAGS += -s     # Silent mode

.PHONY: test test.manifests test.manifests.prepare test.timings test.timings.extract test.timings.merge cli.build cli.test cli.test.unit cli.test.e2e mcp.test.e2e app.node_modules turboui.node_modules cli.node_modules turboui.test.storybook

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
	./devenv bash -c "cd app && mix local.hex --force --if-missing && mix local.rebar --force --if-missing"
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

turboui.test.storybook:
	$(MAKE) turboui.node_modules
	./devenv bash -c "cd turboui && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm run test-storybook:ci"

cli.build:
	$(MAKE) cli.node_modules
	./devenv bash -c "cd cli && npm run build"

cli.test: cli.test.unit

cli.test.unit:
	$(MAKE) cli.node_modules
	cd cli && npm test

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
	@grep "^# Remote dev from another machine" .env >/dev/null || printf "\n# Remote dev from another machine (optional):\n# OPERATELY_DEV_HOST=100.x.x.x\n# DEV_BIND_HOST=0.0.0.0\n" >> .env

dev.mix.deps.clean:
	./devenv bash -c "cd app && mix deps.clean --unlock --unused"

dev.teardown:
	./devenv teardown

#
# Testing tasks
#


test.build:
	$(MAKE) test.up
	$(MAKE) test.app.node_modules
	$(MAKE) test.turboui.build
	$(MAKE) test.app.build
	$(MAKE) test.db.create
	$(MAKE) test.db.migrate

test.setup.turboui:
	$(MAKE) test.up

test.setup.license:
	$(MAKE) test.up
	$(MAKE) test.app.elixir.deps

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

test.app.elixir.deps:
	./devenv bash -c "cd app && MIX_ENV=test mix local.hex --force --if-missing"
	./devenv bash -c "cd app && MIX_ENV=test mix deps.get"

test.app.elixir.build:
	$(MAKE) test.app.elixir.deps
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
	@if [[ -n "$(MANIFEST)" ]]; then \
		./devenv bash -c "./scripts/run_unit_tests.js --manifest $(MANIFEST)"; \
	else \
		./devenv bash -c "./scripts/run_unit_tests.js $(INDEX) $(TOTAL)"; \
	fi

test.mix.features: test.init
	@if [[ -n "$(MANIFEST)" ]]; then \
		./devenv bash -c "./scripts/run_feature_tests.js --manifest $(MANIFEST)"; \
	else \
		./devenv bash -c "./scripts/run_feature_tests.js $(INDEX) $(TOTAL)"; \
	fi

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

test.tsc.lint.turboui:
	./devenv bash -c "cd turboui && npx tsc --noEmit -p tsconfig.json"

test.cli.catalog.sync:
	./devenv bash -c 'cd app && MIX_ENV=test mix run --no-compile --no-start -e "Mix.Tasks.Operately.Gen.Api.Catalog.run([])"'
	$(MAKE) cli.node_modules
	./devenv bash -c "cd cli && npm run check:catalog"

test.pr.name:
	ruby scripts/pr-name-check

test.js.fmt.check:
	./devenv bash -c "./scripts/prettier-check.sh"

test.seed.env:
	@touch .env
	@grep "OPERATELY_BLOB_TOKEN_SECRET_KEY" .env >/dev/null || echo 'OPERATELY_BLOB_TOKEN_SECRET_KEY="lPEuB9ITpbHP1GTf98TPWcHb/CrdeNLzqLcm0zF5mfo="' >> .env
	@grep "^CI=" .env >/dev/null || echo 'CI=$(CI)' >> .env

test.elixir.warnings:
	./devenv bash -c "cd app && MIX_ENV=test mix compile --warnings-as-errors --all-warnings"

test.icons.check:
	bash scripts/icon-linting.sh

#
# Historical test timing artifacts
#
# CI uses these commands and variables to extract per-file runtimes, build the
# shared timing map, and prepare deterministic manifests for every test shard.
TEST_TIMINGS_SUITE ?=
TEST_TIMINGS_SHARD ?=
TEST_TIMINGS_REPORT ?= app/testreports/junit.xml
TEST_TIMINGS_FRAGMENT ?= /tmp/test-timing-$(TEST_TIMINGS_SUITE)-$(TEST_TIMINGS_SHARD).json
TEST_TIMINGS_FRAGMENTS_DIR ?= test-timing-fragments
TEST_TIMINGS_OUTPUT ?= /tmp/test-timings-v1.json
TEST_TIMINGS_UNIT_SHARDS ?= $(shell awk '/- name: Unit Tests$$/ { found=1 } found && $$1 == "parallelism:" { print $$2; exit }' .semaphore/semaphore.yml)
TEST_TIMINGS_FEATURE_SHARDS ?= $(shell awk '/- name: Features$$/ { found=1 } found && $$1 == "parallelism:" { print $$2; exit }' .semaphore/semaphore.yml)
TEST_TIMINGS_SOURCE_COMMIT ?= $(SEMAPHORE_GIT_SHA)
TEST_TIMINGS_INPUT ?= ci/test-timings-v1.json
TEST_MANIFESTS_OUTPUT ?= test-manifests
MANIFEST ?=

test.timings:
	ruby scripts/test_timings/collector_test.rb

test.manifests:
	node --test scripts/test_splitting/file_splitter_test.js scripts/test_splitting/manifest_planner_test.js

test.manifests.prepare:
	node scripts/test_splitting/manifest_planner.js --timings $(TEST_TIMINGS_INPUT) --output $(TEST_MANIFESTS_OUTPUT) --unit-shards $(TEST_TIMINGS_UNIT_SHARDS) --feature-shards $(TEST_TIMINGS_FEATURE_SHARDS)

test.timings.extract:
	ruby scripts/test_timings/collector.rb extract --report $(TEST_TIMINGS_REPORT) --output $(TEST_TIMINGS_FRAGMENT) --suite $(TEST_TIMINGS_SUITE) --shard $(TEST_TIMINGS_SHARD)

test.timings.merge:
	ruby scripts/test_timings/collector.rb merge --fragments $(TEST_TIMINGS_FRAGMENTS_DIR) --output $(TEST_TIMINGS_OUTPUT) --unit-shards $(TEST_TIMINGS_UNIT_SHARDS) --feature-shards $(TEST_TIMINGS_FEATURE_SHARDS) --source-commit $(TEST_TIMINGS_SOURCE_COMMIT)

#
# Building a docker image
#

DOCKER_IMAGE_TAG = $(shell git rev-parse --short HEAD)
DOCKER_PLATFORMS ?= linux/amd64,linux/arm64
DOCKER_BUILDX_BUILDER ?= prodimage-builder
DOCKER_IMAGE_TAGS = -t operately/operately:latest -t operately/operately:$(DOCKER_IMAGE_TAG)

inject.rel.version:
	sed -i -E 's/dev-version/$(shell date +%Y-%m-%d)-$(DOCKER_IMAGE_TAG)/g' app/lib/operately.ex

# docker-container builder required to produce a multi-platform manifest list.
# Override DOCKER_BUILDX_BUILDER if several builders may share a Docker daemon.
docker.buildx.setup:
	docker buildx inspect $(DOCKER_BUILDX_BUILDER) >/dev/null 2>&1 || \
		docker buildx create --name $(DOCKER_BUILDX_BUILDER) --driver docker-container
	docker buildx use $(DOCKER_BUILDX_BUILDER)
	docker buildx inspect --bootstrap

# Native-arch build loaded into the local daemon. Used locally and on PR CI so we
# do not emulate linux/arm64 on every branch.
docker.build:
	$(MAKE) inject.rel.version
	docker buildx build -f Dockerfile.prod $(DOCKER_IMAGE_TAGS) --load .

# Build linux/amd64 and linux/arm64 and push them as one manifest list. Multi-arch
# images cannot be --load'ed into the daemon, so build and push are one step.
docker.buildx.push: docker.buildx.setup
	$(MAKE) inject.rel.version
	docker buildx build --platform $(DOCKER_PLATFORMS) -f Dockerfile.prod \
		$(DOCKER_IMAGE_TAGS) --push .

docker.push: docker.buildx.push

#
# Release related tasks
#

# Build and push the multi-arch image, then copy that manifest to the version
# tag. pull/tag/push would flatten it to a single architecture.
release.tag.docker:
	test -n "$(VERSION)" || (echo "VERSION is required, e.g. make release.tag.docker VERSION=1.3.0" && exit 1)
	$(MAKE) docker.buildx.push
	docker buildx imagetools create \
		-t operately/operately:$(VERSION) \
		operately/operately:$(DOCKER_IMAGE_TAG)

release.build.singlehost:
	elixir app/rel/single-host/build.exs $(VERSION)

release.push.github.release:
	elixir app/rel/make-github-release.exs $(VERSION)
