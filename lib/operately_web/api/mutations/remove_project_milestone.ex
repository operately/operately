defmodule OperatelyWeb.Api.Mutations.RemoveProjectMilestone do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :milestone_id, :string
  end

  outputs do
    field :milestone, :milestone
  end

  def call(conn, inputs) do
    {:ok, milestone_id} = decode_id(inputs.milestone_id)
    milestone = Operately.Projects.get_milestone!(milestone_id)

    Operately.Projects.delete_milestone(me(conn), milestone)

    {:ok, %{milestone: Serializer.serialize(milestone)}}
  end
end
