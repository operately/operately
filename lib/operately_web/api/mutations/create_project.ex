defmodule OperatelyWeb.Api.Mutations.CreateProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :string
    field :name, :string
    field :champion_id, :string
    field :reviewer_id, :string
    field :visibility, :string
    field :creator_is_contributor, :boolean
    field :creator_role, :string
    field :goal_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    person = me(conn)
    
    {:ok, project} = Operately.Projects.create_project(args)
  end
end
