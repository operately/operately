# Development Environment

This project uses the following tools to manage your local development environment:

- **Docker** is a containerisation platform that allows us to package and run our
  applications in a portable and isolated environment. With Docker, we can ensure
  that our application runs consistently across different environments, reducing
  the risk of configuration errors and improving our ability to deploy our
  application quickly and efficiently.

- **Docker Compose** is a tool that allows us to define and run multi-container
  Docker applications. With Docker Compose, we can define our application's services,
  networks, and volumes in a single configuration file, making it easy to set
  up and run our application locally.

- **Makefiles** are a simple yet powerful tool for automating tasks in our
  development process. With Makefiles, we can define a set of tasks that we
  frequently perform, such as building our application, running tests, and
  deploying to a specific environment. By using Makefiles, we can automate these
  tasks, reducing the time and effort required to perform them manually.

Make sure to have all three installed before you start development.

## How to set up a development environment?

First, clone this git repository:

``` bash
git clone git@github.com:/operately/operately
```

Use make to setup build your development docker image, and set up the database:

``` bash
make setup
```

Run tests to make sure that everything is configured properly:

``` bash
make test
```

## Available make targets

The main targets available via `make` are:

- `make dev.server - Start the web application on port 4000.`
- `make dev.shell - Start a bash shell in the development docker image.`
- `make dev.console - Start a development Elixir console.`

- `make dev.db.create - Create a development database.`
- `make dev.db.migrate - Run migrations on the development database.`
- `make dev.db.rollback - Rollback migrations on the development database.`
- `make dev.db.reset - Destroy and Recreate the development database.`

- `make test - Run all tests.`
- `make test.watch - Run a test watcher that reruns tests that are modified.`

Open the [Makefile](/makefile) for detailed description, and additional make targets.
