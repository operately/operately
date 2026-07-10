defmodule Operately.AsyncPublishing.Worker do
  use Oban.Worker

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"type" => type, "id" => id}}) do
    case Operately.AsyncPublishing.ScheduledPostPublishing.run(type, id) do
      {:ok, _} -> :ok
      {:error, reason} ->
        Logger.error("Failed to publish scheduled post: #{inspect(reason)}")
        {:error, reason}
    end
  end
end
