defmodule OperatelyWeb.Api.Queries.GetMilestone do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :include_comments, :boolean
    field :include_tasks_kanban, :boolean
    field :include_project, :boolean
  end

  outputs do
    field :milestone, :milestone
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.id)
    milestone = Operately.Projects.get_milestone!(id, [with_deleted: true])
    milestone = Operately.Repo.preload(milestone, [:project, comments: [comment: [:author, reactions: :person]]])

    {:ok, %{milestone: Serializer.serialize(milestone)}}
  end
end
