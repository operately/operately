defmodule Operately.Search.MaintenanceWorker do
  @moduledoc false

  # Oban stores worker module names with queued jobs. Keep this delegate until
  # all jobs created before the search namespace reorganization have drained.
  defdelegate perform(job), to: Operately.Search.Maintenance.Worker
  defdelegate backoff(job), to: Operately.Search.Maintenance.Worker
  defdelegate timeout(job), to: Operately.Search.Maintenance.Worker
end
