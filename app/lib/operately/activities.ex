defmodule Operately.Activities do
  import Ecto.Query, warn: false
  import Operately.Activities.ContextAutoAssigner, only: [assign_context: 1]

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Activities.NotificationDispatcher
  alias Operately.Activities.ListActivitiesOperation

  @notification_dispatch_suppressed_key {__MODULE__, :notification_dispatch_suppressed}

  def get_activity!(id) do
    Repo.get!(Activity, id) |> cast_content()
  end

  def get_activity(id) do
    activity = Repo.get(Activity, id)
    activity && cast_content(activity)
  end

  def list_activities(scope_type, scope_id, actions) do
    ListActivitiesOperation.run(scope_type, scope_id, actions)
  end

  def update_activity(activity, attrs) do
    activity
    |> Activity.changeset(attrs)
    |> Repo.update()
  end

  def without_notification_dispatch(fun) when is_function(fun, 0) do
    previous = Process.get(@notification_dispatch_suppressed_key, false)
    Process.put(@notification_dispatch_suppressed_key, true)

    try do
      fun.()
    after
      Process.put(@notification_dispatch_suppressed_key, previous)
    end
  end

  def insert_sync(multi, author_id, action, callback, opts \\ []) do
    multi
    |> Ecto.Multi.insert(:activity, fn changes ->
      {:ok, content} = build_content(Atom.to_string(action), callback.(changes))
      comment_thread_id = Keyword.get(opts, :comment_thread_id, nil)

      Activity.changeset(%{
        author_id: author_id,
        action: Atom.to_string(action),
        content: content,
        comment_thread_id: comment_thread_id,
      })
    end)
    |> assign_context()
    |> dispatch_notification(opts)
  end

  def dispatch_notification(multi, opts) do
    include_notification = Keyword.get(opts, :include_notification, true)

    if include_notification and not notification_dispatch_suppressed?() do
      enqueue_notification_dispatch(multi)
    else
      multi
    end
  end

  def dispatch_notification(multi) do
    if notification_dispatch_suppressed?() do
      multi
    else
      enqueue_notification_dispatch(multi)
    end
  end

  defp enqueue_notification_dispatch(multi) do
    multi
    |> Ecto.Multi.run(:dispatch_notification, fn _repo, changes ->
      job = NotificationDispatcher.new(%{activity_id: changes.activity.id})
      Oban.insert(job)
    end)
  end

  defp notification_dispatch_suppressed? do
    Process.get(@notification_dispatch_suppressed_key, false)
  end

  def build_content!(action, params) do
    case build_content(action, params) do
      {:ok, content} -> content
      {:error, changeset} -> raise "Invalid content for #{action}: #{inspect(changeset)}"
    end
  end

  def cast_content(activity) do
    if module = content_module(activity.action) do
      changeset = module.cast_all_fields(activity.content)
      casted = Ecto.Changeset.apply_changes(changeset)

      %{activity | content: casted}
    else
      %{activity | content: nil}
    end
  end

  def build_content(action, params) do
    module = content_module!(action)
    changeset = module.changeset(params)

    if changeset.valid? do
      fields = module.__schema__(:fields)
      content = Ecto.Changeset.apply_changes(changeset)
      content = Operately.Activities.Encoder.encode(content)

      {:ok, Map.take(content, fields)}
    else
      {:error, changeset}
    end
  end

  def content_module(action) when is_atom(action) do
    content_module(Atom.to_string(action))
  end

  def content_module(action) when is_binary(action) do
    full_module_name = "Elixir.Operately.Activities.Content.#{Macro.camelize(action)}"

    try do
      String.to_existing_atom(full_module_name)
    rescue
      ArgumentError -> nil
    end
  end

  defp content_module!(action) do
    case content_module(action) do
      nil -> raise ArgumentError, "Unknown activity action: #{inspect(action)}"
      module -> module
    end
  end
end
