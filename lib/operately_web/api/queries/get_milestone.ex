defmodule OperatelyWeb.Api.Queries.GetMilestone do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :include_comments, :boolean
    field :include_tasks_kanban, :boolean
  end

  outputs do
    field :milestone, :milestone
  end

  def call(_conn, inputs) do
    milestone = Operately.Projects.get_milestone!(inputs.id, [with_deleted: true])
    milestone = Operately.Repo.preload(milestone, [comments: [comment: [:author, reactions: :person]]])

    {:ok, %{milestone: Serializer.serialize(milestone)}}
  end
end
