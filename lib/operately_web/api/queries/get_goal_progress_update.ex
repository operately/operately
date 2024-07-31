defmodule OperatelyWeb.Api.Queries.GetGoalProgressUpdate do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Updates.Update

  inputs do
    field :id, :string
    field :include_goal, :boolean
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.id)

    case load(me(conn), id) do
      nil ->
        {:error, :not_found}
      update ->
        {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(update, level: :full)}}
    end
  end

  defp load(person, id) do
    from(g in Goal,
      join: u in Update, on: g.id == u.updatable_id,
      where: u.id == ^id,
      preload: :targets,
      order_by: [desc: u.inserted_at],
      select: %{update: u, goal: g}
    )
    |> filter_by_view_access(person.id)
    |> Repo.one()
    |> preload_resources()
    |> load_goal_permissions(person)
  end

  defp preload_resources(nil), do: nil
  defp preload_resources(%{update: update, goal: goal}) do
    update = Repo.preload(update, [:author, :acknowledging_person, reactions: [:person]])
    %{update | goal: goal}
  end

  defp load_goal_permissions(nil, _), do: nil
  defp load_goal_permissions(update, person) do
    goal = Goal.preload_permissions(update.goal, person)
    %{update | goal: goal}
  end
end
