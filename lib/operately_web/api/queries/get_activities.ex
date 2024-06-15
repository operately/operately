defmodule OperatelyWeb.Api.Queries.GetActivities do
  use TurboConnect.Query

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Projects.Project
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Updates.Update
  alias Operately.People.Person

  import Ecto.Query, only: [from: 2, limit: 2, preload: 2]

  inputs do
    field :scope_id, :string
    field :scope_type, :string
    field :actions, list_of(:string)
  end

  outputs do
    field :activities, list_of(:activity)
  end

  def call(conn, inputs) do
    company_id = conn.assigns.current_account.person.company_id
    scope_id = inputs[:scope_id]
    scope_type = inputs[:scope_type]
    actions = inputs[:actions] || []
    activities = load_activities(company_id, scope_type, scope_id, actions)

    {:ok, %{activities: OperatelyWeb.Api.Serializers.Activity.serialize(activities)}}
  end

  #
  # Loading data
  #

  def load_activities(company_id, scope_type, scope_id, actions) do
    Activity
    |> limit_search_to_current_company(company_id)
    |> scope_query(scope_type, scope_id)
    |> filter_by_action(actions)
    |> order_desc()
    |> limit(100)
    |> preload([:comment_thread, :author])
    |> Repo.all()
    |> Enum.map(&Operately.Activities.cast_content/1)
    |> preload(Project, id: :project_id, as: :project)
    |> preload(Goal, id: :goal_id, as: :goal)
    |> preload(Group, id: :space_id, as: :space)
    |> preload(Update, id: :discussion_id, as: :discussion)
    |> preload(Person, id: :person_id, as: :person)
  end

  def limit_search_to_current_company(query, company_id) do
    from a in query, where: fragment("? ->> ? = ?", a.content, "company_id", ^company_id)
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

  def filter_by_action(query, []) do
    from a in query, where: a.action not in ^Activity.deprecated_actions()
  end

  def filter_by_action(query, actions) do
    from a in query, where: a.action in ^actions and a.action not in ^Activity.deprecated_actions()
  end

  # defp preload(activities, model, id: id_key, as: field) do
  #   ids = 
  #     activities 
  #     |> Enum.filter(fn a -> a.content[id_key] end) 
  #     |> Enum.map(fn a -> a.content[id_key] end)

  #   query = from m in model, where: m.id in ^ids
  #   opts = [include_deleted: true]
  #   records = Repo.all(query, opts) |> Enum.map(fn r -> {r.id, r} end) |> Map.new()
  
  #   Enum.map(activities, fn a ->
  #     if a.content[id_key] do
  #       record = Map.get(records, a.content[id_key])

  #       put_in(a, [Access.key(:content), Access.key(field)], record)
  #     else
  #       a
  #     end
  #   end)
  # end

  defp preload(activities, schema, id: id_key, as: field) do
    for_loading = 
      activities
      |> Enum.flat_map(fn a -> 
        Enum.map(a.content, fn {k, v} -> 
          cond do
            k == id_key -> 
              {a.id, k, field, v}
            v != field && v.__struct__ == Ecto.Association.NotLoaded && v.__owner__ == schema ->
              {v.id, k, v, a.content["#{k}_id"]}
            true ->
              nil
          end
        end)
        |> Enum.reject(&is_nil/1)
      end)

    IO.inspect(for_loading)

    ids = Enum.map(for_loading, &elem(&1, 3)) |> Enum.uniq()
    query = from m in schema, where: m.id in ^ids
    opts = [include_deleted: true]
    records = Repo.all(query, opts) |> Enum.map(fn r -> {r.id, r} end) |> Map.new()

    IO.inspect(for_loading)
    IO.inspect(records)

    Enum.reduce(for_loading, activities, fn {activity_id, _key, field, id}, acc ->
      record = Map.get(records, id)

      if record do
        Enum.map(acc, fn a ->
          if a.id == activity_id do
            put_in(a, [Access.key(:content), Access.key(field)], record)
          else
            a
          end
        end)
      else
        acc
      end
    end)
  end

end
