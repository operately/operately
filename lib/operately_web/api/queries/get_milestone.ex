defmodule OperatelyWeb.Api.Queries.GetMilestone do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 3]

  alias Operately.Projects.Milestone

  inputs do
    field :id, :string
    field :include_comments, :boolean
    field :include_tasks_kanban, :boolean
    field :include_project, :boolean
  end

  outputs do
    field :milestone, :milestone
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.id)

    milestone = load(me(conn), id)

    if milestone do
      {:ok, %{milestone: Serializer.serialize(milestone)}}
    else
      {:error, :not_found}
    end
  end

  defp load(person, id) do
    from(m in Milestone,
      preload: [:project, comments: [comment: [:author, reactions: :person]]],
      where: m.id == ^id
    )
    |> filter_by_view_access(person.id, join_parent: :project)
    |> Repo.one()
  end
end
