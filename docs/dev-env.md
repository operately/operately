# Operately Development Environment

This document describes how to set up a development environment for the Operately project.

## Table of Contents

- [Pre-requisites](#0-pre-requisites)
- [Clone the Repository](#1-clone-the-repository)
- [Set up the Development Environment](#2-set-up-the-development-environment)
- [Start the Development Environment](#3-start-the-development-environment)
- [Run the migrations](#4-run-the-migrations)
- [Create a development user and company](#5-create-a-development-user-and-company)
- [Start the Phoenix server](#6-start-the-phoenix-server)

## 0. Pre-requisites

The project uses Docker and Make to manage the development environment.
Make sure you have both installed on your machine.

- [Docker](https://docs.docker.com/get-docker/)
- [Make](https://www.gnu.org/software/make/)

Test if you have Docker installed:

``` bash
docker --version
```

Test if your Docker version is comming with Docker Compose:

``` bash
docker compose --version
```

Test if you have Make installed:

``` bash
make --version
```

## 1. Clone the Repository

Clone the repository to your local machine:

``` bash
git clone git@github.com:/operately/operately
```

Change to the project directory:

``` bash
cd operately
```

## 2. Set up the Development Environment

To set up the development environment, run the following command:

``` bash
make setup
```

This command will build the Docker images and install the dependencies.

## 3. Start the Development Environment

Start your development environment with the following command:

``` bash
make up
```

This command will start the development environment, more specifically the
Docker containers that run the application, database, and other services.

## 4. Run the migrations

Run the migrations to create the database schema:

``` bash
make dev.db.create
make test.db.create
make migrate
```

## 5. Create a development user and company

To create a development user and company, start an Elixir interactive shell:

``` bash
make dev.mix.console
```

In the Elixir shell, run the following commands:

``` elixir
alias Operately.People
alias Operately.Companies
alias Operately.Repo

name = "<YOUR_FULL_NAME>"
email = "<YOUR_EMAIL>"
password = "<YOUR_PASSWORD>" # min 12 characters

{:ok, account} = Repo.insert(People.Account.registration_changeset(%{email: email, password: password}))
{:ok, company} = Repo.insert(Companies.Company.changeset(%{name: "Acme Inc"}))
{:ok, person} = Repo.insert(People.Person.changeset(%{account_id: account.id, company_id: company.id, full_name: name}))
```

When you run these commands, a new user and company will be created in the database.
To close the Elixir shell, press `Ctrl+C` twice.

## 6. Start the Phoenix server

To start the Phoenix server, run the following command:

``` bash
make dev.server
```

The Phoenix server will start at [http://localhost:4000](http://localhost:4000).
Enter the email and password you used to create the development user to log in.
