defmodule Operately.Activities do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Activities.Recorder
  alias Operately.Activities.NotificationDispatcher
  alias Operately.Activities.ListActivitiesOperation

  def get_activity!(id) do
    Repo.get!(Activity, id)
  end

  def list_activities(scope_type, scope_id) do
    ListActivitiesOperation.run(scope_type, scope_id)
  end

  def insert(multi, author_id, action, callback) do
    Ecto.Multi.run(multi, :activity_recording_job, fn _repo, changes ->
      job = Recorder.new(%{
        action: action,
        author_id: author_id,
        params: callback.(changes),
      }) 

      Oban.insert(job)
    end)
  end

  def insert_sync(multi, author_id, action, callback) do
    multi
    |> Ecto.Multi.insert(:activity, fn changes ->
      {:ok, content} = build_content(Atom.to_string(action), callback.(changes))

      Activity.changeset(%{
        author_id: author_id, 
        action: Atom.to_string(action),
        content: content
      })
    end)
    |> Ecto.Multi.run(:dispatch_notification, fn _repo, changes ->
      job = NotificationDispatcher.new(%{activity_id: changes.activity.id})
      Oban.insert(job)
    end)
  end

  defp build_content(action, params) do
    module = find_module("Operately.Activities.Content", action)
    changeset = apply(module, :build, [params])

    if changeset.valid? do
      content = Ecto.Changeset.apply_changes(changeset)
      {:ok, content}
    else
      {:error, changeset}
    end
  end

  defp find_module(base, action) do
    full_module_name = "Elixir.#{base}.#{Macro.camelize(action)}"
    String.to_existing_atom(full_module_name)
  end
end
