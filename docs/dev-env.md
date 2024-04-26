# Operately Development Environment

This document describes how to set up a development environment for the Operately project.

## Table of Contents

- [Pre-requisites](#0-pre-requisites)
- [Clone the Repository](#1-clone-the-repository)
- [Build the development docker images](#2-build-the-development-docker-images)
- [Start the development environment](#3-start-the-development-environment)
- [Set up the development environment (install dependencies)](#4-set-up-the-development-environment-install-dependencies)
- [Create the dev and test databases and run the migrations](#5-create-the-dev-and-test-databases-and-run-the-migrations)
- [Create a development user and company](#6-create-a-development-user-and-company)
- [Start the Phoenix server](#7-start-the-phoenix-server)

## 0. Pre-requisites

The project uses Docker and Make to manage the development environment.
Make sure you have both installed on your machine.

- [Docker](https://docs.docker.com/get-docker/)
- [Make](https://www.gnu.org/software/make/)

Test if you have Docker installed:

``` bash
$ docker --version
Docker version 24.0.0, build 24.0.0-6
```

Test if your Docker version has the `compose` plugin installed:

``` bash
$ docker compose version
Docker Compose version v2.20.0
```

Test if you have Make installed:

``` bash
$ make --version
GNU Make 4.3
Built for aarch64-unknown-linux-gnu
Copyright (C) 1988-2020 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

## 1. Clone the Repository

Clone the repository to your local machine:

``` bash
git clone https://github.com/operately/operately.git
```

Change to the project directory:

``` bash
cd operately
```

## 2. Build the development docker images

To build the development docker images, run the following command:

``` bash
make build
```

## 3. Start the development environment

Operately uses Docker Compose to manage the development environment.
Both the application and the database run in Docker containers.

To start the development environment, run the following command:

``` bash
make up
```

## 4. Set up the development environment (install dependencies)

To set up the development environment, run the following command:

``` bash
make setup
```

This command will build the Docker images and install the dependencies.

## 5. Create the dev and test databases and run the migrations

Run the migrations to create the database schema:

``` bash
make dev.db.create
make test.db.create
make migrate
```

## 6. Create a development user and company

First, create an account:

``` bash
make dev.create.account EMAIL=<your-email> PASSWORD=<your-password>
```

Then, create a company:

``` bash
make dev.create.company NAME=<your-company-name>
```

Finally, add the account to the company:

``` bash
make dev.add.account.to.company ACCOUNT_EMAIL=<your-email> COMPANY_NAME=<your-company-name> NAME=<your-full-name> ROLE=<your-role-in-the-company>
```

Example:

``` bash
make dev.create.account EMAIL="john@localhost.dev" PASSWORD="keyboardcat123!!!"
make dev.create.company NAME="Acme Inc."
make dev.add.account.to.company ACCOUNT_EMAIL="john@localhost.dev" COMPANY_NAME="Acme Inc." NAME="John Doe" ROLE="Software Engineer"
```

## 7. Start the Phoenix server

To start the Phoenix server, run the following command:

``` bash
make dev.server
```

The Phoenix server will start at [http://localhost:4000](http://localhost:4000).
Enter the email and password you used to create the development user to log in.
