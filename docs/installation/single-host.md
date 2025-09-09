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

### Set up email delivery (optional)

Operately supports multiple email delivery methods. You can choose from:

1. **SendGrid** - A cloud-based email service. You'll need to [create a SendGrid account](https://sendgrid.com/docs/ui/account-and-settings/api-keys/) and get an API key.
2. **SMTP** - Use your own SMTP server or a third-party service like Gmail, Outlook, or any other SMTP provider.
3. **Configure later** - Skip email configuration during installation and set it up later.

You can choose your preferred option during the installation process.

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

- **Domain**: The domain you pointed to your server (e.g. `operately.example.com`)
- **Email delivery method**: Choose between SendGrid, SMTP, or configure later
  - If you choose **SendGrid**: You'll need to provide your SendGrid API key
  - If you choose **SMTP**: You'll need to provide your SMTP server details (host, port, username, password, SSL settings)
  - If you choose **Configure later**: Email delivery will be skipped and can be configured later
- **SSL certificates**: Whether you want Operately to automatically manage SSL certificates via Let's Encrypt

### Start Operately

Start Operately with Docker Compose:

```bash
docker compose up --wait --detach
```

Operately should now be running on your server. You can access it by navigating to the domain you
configured earlier (e.g. `https://operately.example.com`).
