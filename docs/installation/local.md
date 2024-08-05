# Try out Operately on your local machine

This guide will walk you through the steps to try out Operately on your local machine.

- [Install Docker and Docker Compose](#install-docker-and-docker-compose)
- [Download the latest release of Operately](#download-the-latest-release-of-operately)
- [Configure Operately](#configure-operately)

Running Operately locally is a great way to get a feel for the application and 
explore its features. For a production installation, see the 
[Single Host Installation](installation/single-host.md) guide.

### Install Docker and Docker Compose

Operately is a set of Docker containers orchestrated by Docker Compose. To install 
Docker and Docker Compose, follow the instructions for your operating system:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Download the latest release of Operately

First, create a directory for Operately and navigate to it:

```bash
mkdir ~/operately
cd ~/operately
```

Next, download the latest release of Operately:

```bash
curl -L https://github.com/opera/operately/releases/latest/download/operately.tar.gz
tar -xvf operately.tar.gz
```

### Configure Operately

Operately uses environment variables to configure the application. Edit the `operately.env` and
fill in the required values:

```bash
OPERATELY_HOST="localhost:4000"
```

### Start Operately

Start Operately with Docker Compose:

```bash
docker-compose up -d
```

Operately should now be running on your local machine. You can access it by navigating to 
`http://localhost:4000`.
