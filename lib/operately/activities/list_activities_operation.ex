defmodule Operately.Activities.ListActivitiesOperation do
  import Ecto.Query
  alias Operately.Repo
  alias Operately.Activities.Activity

  def run(scope_type, scope_id, actions) do
    Activity
    |> scope_query(scope_type, scope_id)
    |> actions_filter(actions)
    |> company_query()
    |> order_desc()
    |> Repo.all()
    |> Enum.map(&Operately.Activities.cast_content/1)
  end

  def company_query(query) do
    from a in query, where: fragment("? ->> ? IS NOT NULL", a.content, "company_id")
  end

  def actions_filter(query, actions) do
    if actions == [] do
      from a in query, where: a.action not in ^Activity.deprecated_actions()
    else
      from a in query, where: a.action in ^actions and a.action not in ^Activity.deprecated_actions()
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
end
