defmodule Operately.Activities.ListActivitiesOperation do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.Activities.Activity

  def run(scope_type, scope_id) do
    query(scope_type, scope_id) |> Repo.all()
  end

  def query(scope_type, scope_id) do
    key = "#{scope_type}_id"
    id = scope_id

    from a in Activity,
      where: fragment("? ->> ? = ?", a.content, ^key, ^id),
      where: fragment("? ->> ? IS NOT NULL", a.content, "company_id"),
      order_by: [desc: a.inserted_at]
  end
end
