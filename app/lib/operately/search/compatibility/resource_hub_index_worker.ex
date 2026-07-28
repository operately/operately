defmodule Operately.Search.ResourceHubIndex.Worker do
  @moduledoc false

  # Oban stores worker module names with queued jobs. Keep this delegate until
  # all jobs created before the search namespace reorganization have drained.
  defdelegate perform(job), to: Operately.Search.Indexing.ResourceHub.Worker
  defdelegate backoff(job), to: Operately.Search.Indexing.ResourceHub.Worker
  defdelegate timeout(job), to: Operately.Search.Indexing.ResourceHub.Worker
end
