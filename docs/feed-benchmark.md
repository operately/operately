# Activity feed benchmark

Run from the repository root with the development containers and dependencies
available:

```bash
make benchmark.feed.seed
make benchmark.feed.run
```

No web server, browser, Vite, login, or port configuration is needed. The normal
development server can stay running. Benchmark mode disables HTTP serving,
watchers, background jobs, onboarding/company notifications, billing, and beacon
reporting, and uses the local mail adapter.

## Dataset

The seed creates and migrates the isolated `operately_feed_benchmark` database.
Commands reject production mode and other database names. The default dataset
contains 20,000 activities, approximately 50 people and 460 access contexts, and
overlapping company, space, and direct permissions. It includes a broad-access
member and a restricted member, valid activity references, deleted resources,
and tied timestamps.

Repeating the seed with the same parameters validates and reuses the dataset.
Changing its size requires an explicit rebuild:

```bash
make benchmark.feed.seed ACTIVITIES=100000 RESET=true
make benchmark.feed.run
```

Reset affects only the benchmark database. Previous result directories remain
available. To reuse an existing 100,000-activity dataset, pass `ACTIVITIES=100000`
without `RESET`, or simply run the benchmark. `run` uses the existing manifest.
Datasets created by the earlier browser-enabled tooling remain reusable.

## Measurements

The command benchmarks pages 1 and 10 for both members using the current shared
feed query builder. It follows real continuation cursors to reach page 10.

- Each scenario reports the first invocation and five repeats. The first
  invocation is not a claim of a cold database cache.
- Progress identifies each sample, cursor request, and text/JSON explain capture.
- A final table reports SQL and handler median/maximum timings for the repeats,
  followed by total benchmark duration.
- Detailed measurements separate SQL execution, association preloads, content
  casting/preloading, serialization, and the complete endpoint handler. They
  include database query counts and cumulative query/queue durations.

Each sample executes the query once for staged measurements and again through
the full handler. The handler excludes HTTP, middleware, network, and browser
overhead. Do not add handler timing to the staged timings. Each explain capture
also executes the query, so a scenario with eight-second queries can take around
two minutes before cursor traversal and the next scenario begin.

## Comparing changes

Results are saved under ignored `tmp/feed-benchmark/run-*/` directories: text and
JSON explain plans, per-scenario samples and stage timings, ordered IDs/cursors,
`summary.json`, and environment metadata including dataset counts, indexes,
planner settings, and Git revision/status. The dataset manifest is stored in
`tmp/feed-benchmark/dataset.json`.

Preserve a baseline directory, change the query, and rerun without reseeding.
Compare IDs/cursors as well as timings, estimates, loops, and temporary blocks.
The command leaves planner settings unchanged. Its pathological-join indicator
detects the original repeated-materialization failure pattern; `false` does not
by itself prove that a query is fast.

Browser checks, when needed, are separate tests against the normal development
server and its development database.
