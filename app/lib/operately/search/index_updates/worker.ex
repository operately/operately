defmodule Operately.Search.IndexUpdates.Worker do
  @moduledoc """
  Refreshes registered search sources after their canonical transaction commits.
  """

  use Oban.Worker,
    queue: :default,
    max_attempts: 5,
    unique: [period: 60, fields: [:worker, :args], states: [:available, :scheduled, :retryable]]

  alias Operately.Search.{ErrorCategory, SourceIndexer}

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"source_type" => source_type, "source_ids" => source_ids}}) do
    case SourceIndexer.sync_all(source_type, source_ids) do
      {:ok, _summary} -> :ok
      {:error, reason} -> {:error, ErrorCategory.sanitize(reason)}
    end
  end
end
