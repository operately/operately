defmodule Operately.Search.ResourceHubIndex.Worker do
  @moduledoc """
  Refreshes resource-hub search entries after their canonical transaction commits.

  Jobs always reload current source data, so queued duplicate edits may be coalesced
  safely. A new job is still allowed while an older one is executing, ensuring that
  an edit committed during a refresh receives another pass.
  """

  use Oban.Worker,
    queue: :default,
    max_attempts: 5,
    unique: [period: 60, fields: [:worker, :args], states: [:available, :scheduled, :retryable]]

  alias Operately.Search.{ErrorCategory, ResourceHubIndex}
  alias Operately.Search.IndexUpdates

  @impl Oban.Worker
  # TODO: Remove after all jobs queued under this legacy worker have completed.
  def perform(%Oban.Job{args: %{"source_type" => source_type, "source_ids" => source_ids}}) do
    IndexUpdates.Worker.perform(%Oban.Job{args: %{"source_type" => source_type, "source_ids" => source_ids}})
  end

  def perform(%Oban.Job{args: %{"folder_id" => folder_id}}) do
    case ResourceHubIndex.refresh_folder_tree(folder_id) do
      {:ok, _summary} -> :ok
      {:error, reason} -> {:error, ErrorCategory.sanitize(reason)}
    end
  end
end
