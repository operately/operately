# Running multiple local development instaces to support multiple LLM agents

This guide describes how to run multiple Operately development instances.
The main motivation is to be able to run multiple local LLM agents to write code.

## Overall strategy

- Use separate Git worktrees for each Operately instance to isolate codebases.
- Configure a unique `.env` file in each worktree and set a distinct `PORT_OFFSET` to avoid port conflicts.
- Each worktree runs its own development server and supporting services.
- Open a separate VS Code window for each git worktree.

This approach enables concurrent development and testing with multiple
LLM agents in parallel. Easily manage, build, and clean up each instance
without affecting others.

## 1. Create an Additional Worktree

From your primary checkout run:

```bash
git worktree add ../operately-2 main
```

Repeat this step for every concurrent instance you need (e.g `git worktree add ../operately-3 main`)

## 2. Switch to the new worktree

Enter the new directory:

```bash
cd ../operately-2
```

## 3. Set up a unique port range

Your primary instance is running on ports 4000-4010. Set an unique offset for this instance, e.g. 4100:

```
echo 'PORT_OFFSET=4100' >> .env
```

This will tell docker-compose to run the services on the following ports:

| Service              | Base Port | Actual Port (with `PORT_OFFSET=4100`) |
| -------------------- | --------- | ------------------------------------- |
| Phoenix (dev.server) | 4000      | 4100                                  |
| Phoenix (tests)      | 4002      | 4102                                  |
| Storybook            | 4003      | 4103                                  |
| Screenshot server    | 4004      | 4104                                  |
| Vite dev server      | 4005      | 4105                                  |
| pgweb                | 4006      | 4106                                  |
| S3 mock              | 4007      | 4107                                  |
| Mailhog UI           | 4008      | 4108                                  |

If you add more worktrees, continue incrementing the offset (e.g. `PORT_OFFSET=4200`, `PORT_OFFSET=4300`, …).

Warning: Port 5000 will not work on MacOS, used by AirPlay.

## 3. Build and Run

With the offset configured, run the server in the worktree:

```bash
make dev.build
make dev.server
```

These commands build Docker images, install dependencies, and start server bound to the
adjusted ports.

## 4. Start a dedicated VS Code Instance

Start a dedicated VS Code instance for every worktree, and use the LLM in that directory.
