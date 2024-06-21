defmodule Operately.Activities do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Activities.Recorder
  alias Operately.Activities.NotificationDispatcher
  alias Operately.Activities.ListActivitiesOperation

  def get_activity!(id) do
    Repo.get!(Activity, id) |> cast_content()
  end

  def list_activities(scope_type, scope_id, actions) do
    ListActivitiesOperation.run(scope_type, scope_id, actions)
  end

  def insert(multi, author_id, action, callback) do
    IO.puts """
    [DEPRECATION] Operately.Activities.insert/4 is deprecated. Use Operately.Activities.insert_sync/4 instead.
    """

    Ecto.Multi.run(multi, :activity_recording_job, fn _repo, changes ->
      job = Recorder.new(%{
        action: action,
        author_id: author_id,
        params: callback.(changes),
      })

      Oban.insert(job)
    end)
  end

  def insert_sync(multi, author_id, action, callback, opts \\ []) do
    multi
    |> Ecto.Multi.insert(:activity, fn changes ->
      {:ok, content} = build_content(Atom.to_string(action), callback.(changes))

      Activity.changeset(%{
        author_id: author_id,
        action: Atom.to_string(action),
        content: content
      })
    end)
    |> dispatch_notification(opts)
  end

  def dispatch_notification(multi, opts) do
    include_notification = Keyword.get(opts, :include_notification, true)

    if include_notification do
      dispatch_notification(multi)
    else
      multi
    end
  end

  def dispatch_notification(multi) do
    multi
    |> Ecto.Multi.run(:dispatch_notification, fn _repo, changes ->
      job = NotificationDispatcher.new(%{activity_id: changes.activity.id})
      Oban.insert(job)
    end)
  end

  def build_content!(action, params) do
    case build_content(action, params) do
      {:ok, content} -> content
      {:error, changeset} -> raise "Invalid content for #{action}: #{inspect(changeset)}"
    end
  end

  def cast_content(activity) do
    module = find_module("Operately.Activities.Content", activity.action)

    if module do
      changeset = module.cast_all_fields(activity.content)
      casted = Ecto.Changeset.apply_changes(changeset)

      %{activity | content: casted}
    else
      %{activity | content: nil}
    end
  end

  def build_content(action, params) do
    module = find_module("Operately.Activities.Content", action)
    changeset = module.changeset(params)

    if changeset.valid? do
      fields = module.__schema__(:fields)
      content = Ecto.Changeset.apply_changes(changeset)

      {:ok, Map.take(content, fields)}
    else
      {:error, changeset}
    end
  end

  defp find_module(base, action) when is_atom(action) do
    find_module(base, Atom.to_string(action))
  end

  defp find_module(base, action) when is_binary(action) do
    full_module_name = "Elixir.#{base}.#{Macro.camelize(action)}"
    String.to_existing_atom(full_module_name)
  end
end
