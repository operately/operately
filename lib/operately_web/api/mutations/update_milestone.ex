defmodule OperatelyWeb.Api.Mutations.UpdateMilestone do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :milestone_id, :string
    field :title, :string
    field :deadline_at, :string
  end

  outputs do
    field :milestone, :milestone
  end

  def call(_conn, inputs) do
    {:ok, milestone_id} = decode_id(inputs.milestone_id)

    title = inputs.title
    deadline_at = inputs.deadline_at

    milestone = Operately.Projects.get_milestone!(milestone_id)
    deadline = deadline_at && NaiveDateTime.new!(deadline_at, ~T[00:00:00])

    {:ok, milestone} = Operately.Projects.update_milestone(milestone, %{
      title: title,
      deadline_at: deadline
    })

    {:ok, %{milestone: Serializer.serialize(milestone)}}
  end
end
