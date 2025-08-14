defmodule OperatelyWeb.Api.Mutations.CreateTask do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 3, forbidden_or_not_found: 3]

  alias Operately.Repo

  inputs do
    field :name, :string, null: false
    field :milestone_id, :id, null: false
    field? :assignee_ids, list_of(:id), null: true
    field? :description, :string, null: true
  end

  outputs do
    field? :task, :task, null: true
  end

  def call(conn, inputs) do
    author = me(conn)

    if has_permissions?(author, inputs.milestone_id) do
      {:ok, task} = Operately.Operations.TaskAdding.run(author, inputs)
      {:ok, %{task: Serializer.serialize(task, level: :essential)}}
    else
      query(inputs.milestone_id)
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
