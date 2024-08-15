defmodule OperatelyWeb.Api.Mutations.EditGoalProgressUpdate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [forbidden_or_not_found: 3]

  inputs do
    field :id, :string
    field :content, :string
    field :new_target_values, :string
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    {:ok, update_id} = decode_id(inputs.id)
    author = me(conn)

    case load(author, update_id) do
      nil ->
        query(update_id)
        |> forbidden_or_not_found(author.id, named_binding: :goal)

      {update, goal} ->
        content = Jason.decode!(inputs.content)
        target_values = Jason.decode!(inputs.new_target_values)

        {:ok, update} = Operately.Operations.GoalCheckInEdit.run(author, goal, update, content, target_values)
        {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(update, level: :full)}}
    end
  end

  defp load(author, update_id) do
    from([update: u, goal: g] in query(update_id),
      where: u.author_id == ^author.id,
      select: {u, g}
    )
    |> Repo.one()
  end

  defp query(update_id) do
    from(u in Operately.Updates.Update, as: :update,
      join: g in Operately.Goals.Goal, on: u.updatable_id == g.id, as: :goal,
      where: u.id == ^update_id
    )
  end
end
