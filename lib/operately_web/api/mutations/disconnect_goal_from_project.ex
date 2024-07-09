defmodule OperatelyWeb.Api.Mutations.DisconnectGoalFromProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
    field :goal_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, project_id} = decode_id(inputs.project_id)
    {:ok, goal_id} = decode_id(inputs.goal_id)

    project = Operately.Projects.get_project!(project_id)
    goal = Operately.Goals.get_goal!(goal_id)

    {:ok, project} = Operately.Operations.ProjectGoalDisconnection.run(person, project, goal)
    {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
  end
end
