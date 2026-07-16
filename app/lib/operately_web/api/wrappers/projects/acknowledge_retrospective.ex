defmodule OperatelyWeb.Api.Wrappers.Projects.AcknowledgeRetrospective do
  @moduledoc """
  Acknowledges a project retrospective by project ID.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Retrospective
  alias OperatelyWeb.Api.Projects.AcknowledgeRetrospective, as: ProjectAcknowledgeRetrospective

  inputs do
    field :project_id, :id, null: false
  end

  outputs do
    field :retrospective, :project_retrospective, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, retrospective} <- Retrospective.get(me, project_id: inputs.project_id) do
      ProjectAcknowledgeRetrospective.call(conn, %{id: retrospective.id})
    end
  end
end
