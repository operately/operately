defmodule OperatelyWeb.Api.Queries.GetGoalProgressUpdates do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias Operately.Repo

  inputs do
    field :goal_id, :string
  end

  outputs do
    field :updates, :goal_progress_update
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.goal_id)
    updates = load(me(conn), id)
    {:ok, %{updates: OperatelyWeb.Api.Serializer.serialize(updates, level: :full)}}
  end

  defp load(person, goal_id) do
    goal_query = from(g in Operately.Goals.Goal,
        where: g.id == ^goal_id,
        select: g.id
      )
      |> filter_by_view_access(person.id)

    from(u in Operately.Updates.Update,
      where: u.updatable_id in subquery(goal_query),
      where: u.updatable_type == :goal,
      where: u.type == :goal_check_in,
      order_by: [desc: u.inserted_at]
    )
    |> Repo.all()
  end
end
