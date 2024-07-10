defmodule OperatelyWeb.Api.Mutations.UpdateMilestoneDescription do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :description, :string
  end

  outputs do
    field :milestone, :milestone
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.id)

    milestone = Operately.Projects.get_milestone!(id)

    {:ok, milestone} = Operately.Projects.update_milestone(milestone, %{
      description: inputs.description && Jason.decode!(inputs.description)
    })

    {:ok, %{milestone: Serializer.serialize(milestone)}}
  end
end
