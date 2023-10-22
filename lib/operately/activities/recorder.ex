defmodule Operately.Activities.Recorder do
  @moduledoc """
  The `Operately.Activities.Recorder` is responsible for
  recording the activity, inserting the activity, and
  scheduling notifications.
  """
  
  require Logger

  alias Ecto.Multi
  alias Operately.Activities.Activity
  alias Operately.Activities.Content
  alias Operately.Activities.NotificationDispatcher

  def record(context, author, action, changeset) do
    start()
    |> insert_record(changeset)
    |> insert_activity(context, author, action)
    |> schedule_notifications()
    |> Operately.Repo.transaction()
    |> log_result()
    |> extract_result()
  rescue
    err -> Logger.error(Exception.format(:error, err, __STACKTRACE__))
  end

  def start() do
    Multi.new()
  end

  def insert_record(multi, changeset) do
    Multi.insert(multi, :record, changeset)
  end

  def insert_activity(multi, context, author, action) do
    Multi.insert(multi, :activity, fn %{record: record} ->
      content = Content.build(context, action, record)
      
      if content.valid? do
        Activity.changeset(%{
          author_id: author.id,
          action: Atom.to_string(action),
          content: content.changes,
        })
      else
        {:error, content}
      end
    end)
  end

  def schedule_notifications(multi) do
    Multi.run(multi, :notifications, fn _, %{activity: activity} ->
      NotificationDispatcher.new(%{activity_id: activity.id}) |> Oban.insert()
    end)
  end

  def log_result(result) do
    Logger.info("Activity recorded: #{inspect(result)}")

    result
  end

  def extract_result({:ok, map}), do: {:ok, map[:record]}
  def extract_result(error), do: raise error
end
