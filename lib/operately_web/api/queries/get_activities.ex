defmodule OperatelyWeb.Api.Queries.GetActivities do
  # use TurboConnect.Query

  # input :scope_id, :integer
  # input :scope_type, :string
  # input :actions, list_of(:string)

  # output :activities, list_of(:activity)
  # output :pagination, :pagination

  import Ecto.Query, only: [from: 2]

  def call(_conn, inputs) do
    activities = load_activities(inputs.scope_type, inputs.scope_id, inputs.actions)
    {:ok, activities}
  end

  def load_activities(scope_type, scope_id, actions) do
    Operately.Activities.Activity
    |> company_query()
    |> scope_query(scope_type, scope_id)
    |> actions_filter(actions || [])
    |> order_desc()
    |> Operately.Repo.all()
    |> format_activities()
    |> load_referenced()
  end

  def format_activities(activities) do
    Enum.map(activities, fn activity ->
      %{activity | content: keys_to_atoms(activity.content)}
    end)
  end

  def load_referenced(activities) do
    loaded = Enum.flat_map(activities, fn activity ->
      Operately.Activities.find_module(activity.action).references()
      |> Enum.map(fn {_name, key, module, _field} ->
        {module, activity.content[key]}
      end)
    end)
    |> Enum.group_by(fn {module, _} -> module end)
    |> Enum.map(fn {module, grouped} ->
      ids = Enum.map(grouped, fn {_, id} -> id end)

      {module, ids}
    end)
    |> Enum.map(fn {module, ids} ->
      {module, Operately.Repo.all(from m in module, where: m.id in ^Enum.uniq(ids))}
    end)

    activities = Enum.map(activities, fn activity ->
      content = activity.content
      refs = Operately.Activities.find_module(activity.action).references()

      ref_fields = Enum.map(refs, fn {name, key, module, _field} ->
        res = Enum.find(loaded, fn {m, _} -> m == module end)

        case res do
          {_, loaded} -> {name, Enum.find(loaded, fn l -> l.id == content[key] end)}
          _ -> {name, nil}
        end
      end)
      |> Enum.into(%{})

      %{activity | content: Map.merge(content, ref_fields)}
    end)

    activities
  end

  def keys_to_atoms(map) do
    Jason.encode!(map) |> Jason.decode!(keys: :atoms)
  end

  def company_query(query) do
    from a in query, where: fragment("? ->> ? IS NOT NULL", a.content, "company_id")
  end

  @deprecated_actions [
    "project_status_update_acknowledged",
    "project_status_update_commented",
    "project_status_update_edit",
  ]

  def actions_filter(query, actions) do
    if actions == [] do
      from a in query, where: a.action not in ^@deprecated_actions
    else
      from a in query, where: a.action in ^actions and a.action not in ^@deprecated_actions
    end
  end

  def scope_query(query, "person", scope_id) do
    from a in query, where: a.author_id == ^scope_id
  end

  def scope_query(query, scope_type, scope_id) do
    from a in query, where: fragment("? ->> ? = ?", a.content, ^"#{scope_type}_id", ^scope_id)
  end

  def order_desc(query) do
    from a in query, order_by: [desc: a.inserted_at]
  end

  def limit(query, limit) do
    from a in query, limit: ^limit
  end

end
