defmodule Operately.Activities do
  import Ecto.Query, warn: false
  import Operately.Activities.ContextAutoAssigner, only: [assign_context: 1]

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Activities.NotificationDispatcher
  alias Operately.Activities.ListActivitiesOperation

  def get_activity!(id) do
    Repo.get!(Activity, id) |> cast_content()
  end

  def list_activities(scope_type, scope_id, actions) do
    ListActivitiesOperation.run(scope_type, scope_id, actions)
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
    |> assign_context()
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
      content = encode_content(content)

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

  defp encode_content(content) do
    content
    |> IO.inspect(label: "before encode")
    |> Map.from_struct()
    |> Map.to_list()
    |> Enum.reject(fn {_, value} -> match?(%Ecto.Association.NotLoaded{}, value) end)
    |> Enum.map(fn {key, value} -> 
      case Jason.encode(value) do
        {:ok, _} -> {key, value}
        {:error, _} -> {key, encode_content(value)}
      end
    end)
    |> Enum.into(%{})
    |> IO.inspect(label: "after encode")
  end

end
