defmodule Operately.Operations.Discussions.SharedSteps do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.AsyncPublishing.Worker
  alias Operately.Messages.{Message, Owner}

  def lock_message(multi, requester, id) do
    Multi.run(multi, :current, fn repo, _ ->
      # Read the state after acquiring the same lock for edits, publication and discard.
      query = from(m in Message, where: m.id == ^id, lock: "FOR UPDATE")

      case repo.one(Message.visible_to(query, requester)) do
        nil -> {:error, :not_found}
        message when requester == :system -> {:ok, message}
        _ -> Message.get(requester, id: id)
      end
    end)
  end

  def record_activity(multi, actor_id \\ nil) do
    Multi.merge(multi, fn %{message: message} = changes ->
      Owner.record_activity(Multi.new(), changes[:current], message, actor_id || message.author_id)
    end)
  end

  def update_schedule(multi, requested_time) do
    Multi.merge(multi, fn %{message: message} = changes ->
      update_job(Multi.new(), changes[:current], message, requested_time)
    end)
  end

  defp update_job(multi, %{state: state, scheduled_at: time}, %{state: state, scheduled_at: time}, nil), do: multi

  defp update_job(multi, previous, message, requested_time) do
    multi = if previous && previous.state == :scheduled, do: cancel_job(multi, message.id), else: multi

    if message.state == :scheduled do
      job = Worker.new(%{"type" => "message", "id" => message.id}, scheduled_at: requested_time || message.scheduled_at)
      Multi.insert(multi, :scheduled_job, job)
    else
      multi
    end
  end

  def cancel_job(multi, id), do: Multi.delete_all(multi, :cancel_scheduled_job, pending_jobs(id))

  def pending_jobs(id) do
    from(j in Oban.Job,
      where: j.worker == "Operately.AsyncPublishing.Worker" and j.args["type"] == "message" and j.args["id"] == ^id,
      where: j.state in ["available", "scheduled", "retryable"]
    )
  end

  def result({:ok, %{message: message}}), do: {:ok, message}
  def result({:error, _step, reason, _changes}), do: {:error, reason}
end
