defmodule OperatelyWeb.Api.Mutations.AcknowledgeGoalProgressUpdate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [forbidden_or_not_found: 3]

  inputs do
    field :id, :string
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, id} = decode_id(inputs.id)

    case load_update(person.id, id) do
      nil ->
        query(id)
        |> forbidden_or_not_found(person.id, named_binding: :goal)

      update ->
        {:ok, update} = Operately.Updates.acknowledge_update(person, update)
        {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(update)}}
    end
  end

  defp load_update(person_id, update_id) do
    q = query(update_id)

    from([goal: goal] in q, where: goal.reviewer_id == ^person_id)
    |> Repo.one()
  end

  defp query(update_id) do
    from(u in Operately.Updates.Update,
      join: g in Operately.Goals.Goal, on: u.updatable_id == g.id, as: :goal,
      where: u.id == ^update_id
    )
  end
end
