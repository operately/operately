defmodule OperatelyWeb.Api.Mutations.CreateTask do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 3, forbidden_or_not_found: 3]

  alias Operately.Repo

  inputs do
    field :name, :string
    field :assignee_ids, list_of(:string)
    field :description, :string
    field :milestone_id, :string
  end

  outputs do
    field :task, :task
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, milestone_id} = decode_id(inputs.milestone_id)
    {:ok, assignee_ids} = decode_id(inputs.assignee_ids)

    inputs = Map.merge(inputs, %{
      milestone_id: milestone_id,
      assignee_ids: assignee_ids,
    })

    if has_permissions?(author, milestone_id) do
      {:ok, task} = Operately.Operations.TaskAdding.run(author, inputs)
      {:ok, %{task: Serializer.serialize(task, level: :essential)}}
    else
      query(milestone_id)
      |> forbidden_or_not_found(author.id, join_parent: :project)
    end
  end

  defp has_permissions?(author, milestone_id) do
    query(milestone_id)
    |> filter_by_edit_access(author.id, join_parent: :project)
    |> Repo.exists?()
  end

  defp query(milestone_id) do
    from(m in Operately.Projects.Milestone, where: m.id == ^milestone_id)
  end
end
