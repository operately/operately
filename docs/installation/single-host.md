# Instal Operately on a single host

This guide will walk you through the steps to install Operately on a single host.

Pre-requisites:

- [Pick a server](#pick-a-server)
- [Point a domain to your server](#point-a-domain-to-your-server)
- [Set up mail server](#set-up-mail-server)

Installation steps:

- [Install Docker and Docker Compose](#install-docker-and-docker-compose)
- [Download the latest release of Operately](#download-the-latest-release-of-operately)
- [Configure Operately](#configure-operately)
- [Start Operately](#start-operately)

## Pre-requisites

### Pick a server

Pick a machine to host Operately. If you need one in the cloud, we recommend checking out 
[DigitalOcean](https://www.digitalocean.com/), [Linode](https://www.linode.com/), or 
[Hetzer](https://www.hetzner.com/). 

The minimum requirements are 2GB of RAM and 1 CPU which should be enough for a team up 
to 30 people. For larger teams, we recommend 8GB of RAM and 4 CPUs.

### Point a domain to your server

Point a domain to your server. You can use a subdomain like `operately.example.com` or a
root domain like `example.com`. You need to configure the DNS records to point to the IP
address of your server. Make sure it's a straigth DNS pointer and not a proxy (e.g. Cloudflare proxy).

### Install Docker and Docker Compose

Operately is a set of Docker containers orchestrated by Docker Compose. To install Docker 
and Docker Compose, follow the instructions for your operating system:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Set up a mail server

Operately uses SendGrid to send emails. You need to set up a SendGrid account and create an API key.
Follow the instructions on the [SendGrid documentation](https://sendgrid.com/docs/ui/account-and-settings/api-keys/).

## Installation steps

### Download the latest release of Operately

Download the latest release of Operately:

```bash
wget -q https://github.com/operately/operately/releases/latest/download/operately-single-host.tar.gz
tar -xf operately-single-host.tar.gz
cd operately
```

### Run the installation script

Run the installtion script to configure Operately:

```
./install.sh
```

The script will build the Docker images and configure the environment, 
and ask you for the following information:

- *Domain*: The domain you pointed to your server (e.g. `operately.example.com`)
- *SendGrid API key*: The API key you created in the SendGrid dashboard

### Start Operately

Start Operately with Docker Compose:

```bash
docker compose up --wait --detach
```

Operately should now be running on your server. You can access it by navigating to the domain you
configured earlier (e.g. `https://operately.example.com`).
