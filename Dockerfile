FROM elixir:1.14.2

# This is a development image. It is not intended to be used in production.
# It is intended to be used for development and testing.

# If we run everything as root, we can't mount the source code as a volume
# because the volume will be owned by root. This is a problem because the
# source code is owned by the user on the host machine. If we run everything
# as the user, we can mount the source code as a volume and the user on the
# host machine can edit the source code and the changes will be reflected
# inside the container.

# Create a user with the same UID and GID as the user on the host machine.
# This way, the user inside the container will have the same permissions as
# the user on the host machine.

ARG USER_ID
ARG GROUP_ID

# Install the build dependencies and tools.
#
# - build-essential is required to build C dependencies from source code, such as
#   the PostgreSQL client library, or native extensions for Elixir libraries.
#
# - git is required to install Elixir dependencies from git repositories.
#
# - inotify-tools is required to watch for file changes in the source code.
#
# - postgresql-client is required to run the database migrations.
#
# - nodejs is required to compile the assets.
#
# - curl is required to download the latest version of the Node.js package
#

RUN apt-get update -y                              \
 && apt-get install -y                             \
      build-essential                              \
      git                                          \
      nodejs                                       \
      npm                                          \
      curl                                         \
      postgresql-client                            \
      inotify-tools                                \
      chromium                                     \
      chromium-driver                              \
 && apt-get clean && rm -f /var/lib/apt/lists/*_*

# Install the latest version of the Node.js package.

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
 && apt-get install -y nodejs

# Create a user with the same UID and GID as the user on the host machine.
# We will call this user 'dev' inside of the development container.
# The name might differ from your host machine, but the UID and GID will be the same.

RUN groupadd --gid ${GROUP_ID} dev \
 && useradd --uid ${USER_ID} --gid dev --shell /bin/bash --create-home dev

# Switch to the 'dev' user.

USER dev


RUN mix local.hex --force && mix local.rebar --force
RUN mix archive.install hex phx_new 1.7.0-rc.0 --force

# Set the working directory to the source code directory.
# This is where we will mount the source code from the host machine.
# The source code will be owned by the 'dev' user inside the container.

ENV APP_HOME /home/dev/app
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

# Set a simple prompt that shows the current directory.
# This is useful when you are inside the container and you want to know
# where you are, but you don't want other things to clutter the prompt.

RUN echo "export PS1='\w $ '" >> /home/dev/.bashrc

# Wallaby tests are printing out an error message without this folder.
# The error message is harmless, but it is annoying.
# This is a workaround for the error message.
#
# The message is:
# find: ‘/home/dev/.config/chromium/Crash Reports/pending/’: No such file or directory.
RUN mkdir -p "/home/dev/.config/chromium/Crash Reports/pending"

# Set the default command to run when the container starts.
# Start the phoenix server.

CMD ["mix", "phx.server"]
