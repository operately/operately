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
    milestone = Operately.Projects.get_milestone!(inputs.id)
    milestone = Operately.Repo.preload(milestone, [comments: [comment: [:person, reactions: :person]]])

    {:ok, %{serialize: Serializer.serialize(milestone)}}
  end
end
