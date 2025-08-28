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

dev.build:
	$(MAKE) dev.up
	./devenv bash -c "cd app && mix local.hex --force --if-missing"
	./devenv bash -c "cd app && mix deps.get"
	./devenv bash -c "cd app && mix compile"
	./devenv bash -c "cd app && npm install"
	$(MAKE) turboui.build
	$(MAKE) dev.db.create
	$(MAKE) test.db.create
	$(MAKE) dev.db.migrate
	$(MAKE) test.db.migrate

dev.server:
	./devenv bash -c "cd app && iex -S mix phx.server"

turboui.storybook:
	./devenv bash -c "cd turboui && npm run storybook"

turboui.build:
	@rm -rf turboui/dist
	./devenv bash -c "cd turboui && npm install && npm run build"

turboui.test:
	./devenv bash -c "cd turboui && npm install && npm run test"

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
	./devenv bash -c "cd app && MIX_ENV=dev mix ecto.drop"
	./devenv bash -c "cd app && MIX_ENV=test mix ecto.drop"
	./devenv down

#
# Testing tasks
#


test.build:
	$(MAKE) test.up
	$(MAKE) test.turboui.build
	$(MAKE) test.app.build
	$(MAKE) test.db.create
	$(MAKE) test.db.migrate

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

test.turboui.build:
	./devenv bash -c "cd turboui && npm install"
	./devenv bash -c "cd turboui && MIX_ENV=test npm run build"

test.app.build:
	./devenv bash -c "cd app && MIX_ENV=test mix local.hex --force --if-missing"
	./devenv bash -c "cd app && MIX_ENV=test mix deps.get"
	./devenv bash -c "cd app && MIX_ENV=test mix compile"
	$(MAKE) test.app.js.build

test.app.js.build:
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

test.dialyzer:
	./devenv bash -c "cd app && MIX_ENV=test mix dialyzer"

test.tsc.lint:
	./devenv bash -c "cd app && npx tsc --noEmit -p tsconfig.lint.json"

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
