# Operately Development Environment

This document describes how to set up a development environment for the Operately project.

## Table of Contents

- [Pre-requisites](#0-pre-requisites)
- [Clone the Repository](#1-clone-the-repository)
- [Build the development environment](#2-build-the-development-environment)
- [Start the Phoenix server](#3-start-the-phoenix-server)

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

## 2. Build the development environment

To set up the development environment:

``` bash
make dev.build
```

This command will build the Docker images, install the Elixir and Node
dependencies, and compile the project, create the databases, and run the
migrations.

## 3. Start the Phoenix server

To start the Phoenix server, run the following command:

``` bash
make dev.server
```

The Phoenix server will start at [http://localhost:4000](http://localhost:4000).
Enter the email and password you used to create the development user to log in.
