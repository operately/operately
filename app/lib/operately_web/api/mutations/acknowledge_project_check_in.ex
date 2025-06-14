defmodule OperatelyWeb.Api.Mutations.AcknowledgeProjectCheckIn do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 1, from: 2]
  import Operately.Access.Filters, only: [forbidden_or_not_found: 3]

  inputs do
    field? :id, :string, null: true
  end

  outputs do
    field? :check_in, :project_check_in, null: true
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.id)
    person = me(conn)

    check_in = load_check_in(person.id, id)

    cond do
      check_in == nil ->
        from(c in Operately.Projects.CheckIn)
        |> forbidden_or_not_found(person.id, join_parent: :project)

      check_in.acknowledged_at != nil ->
        {:ok, %{check_in: Serializer.serialize(check_in, level: :essential)}}

      check_in.acknowledged_by_id == nil ->
        {:ok, check_in} = Operately.Operations.ProjectCheckInAcknowledgement.run(person, check_in)
        {:ok, %{check_in: Serializer.serialize(check_in, level: :essential)}}
    end
  end

  defp load_check_in(person_id, check_in_id) do
    from(check_in in Operately.Projects.CheckIn,
      join: project in assoc(check_in, :project),
      join: reviewer in assoc(project, :reviewer_contributor),
      preload: [project: project],
      where: check_in.id == ^check_in_id and reviewer.person_id == ^person_id
    )
    |> Repo.one()
  end
end
