defmodule Operately.AI.Tools.GetProjectDetails do
  alias Operately.AI.Tools.Base

  @doc """
  Provides the markdown details of a project.

  This tool retrieves the current state of the specified project
  and returns its markdown representation. The tool uses the conversation author's
  permissions to access the project data.

  Expected context:
  - :person - The person who started the conversation (for authorization)

  Expected arguments:
  - "project_id": The ID of the project to retrieve details for
  """
  def get_project_details do
    Base.new_tool(%{
      name: "get_project_details",
      description: "Returns the markdown details of the specified project.",
      parameters_schema: %{
        type: "object",
        properties: %{
          project_id: %{
            type: "string",
            description: "The ID of the project to retrieve details for."
          }
        },
        required: ["project_id"]
      },
      function: fn args, context ->
        me = Map.get(context, :person)
        project_id = Map.get(args, "project_id")

        with(
          {:ok, id} <- OperatelyWeb.Api.Helpers.decode_id(project_id),
          {:ok, project} <- get_project(me, id)
        ) do
          markdown = Operately.MD.Project.render(project)
          {:ok, markdown}
        else
          {:error, reason} when is_binary(reason) ->
            {:error, "Unable to access project: #{reason}"}

          {:error, reason} ->
            {:error, "Invalid project ID: #{inspect(reason)}"}
        end
      end
    })
  end

  defp get_project(person, project_id) do
    Operately.Projects.Project.get(person,
      id: project_id,
      opts: [
        with_deleted: false,
        preload: [
          :group,
          :creator,
          :goal,
          :retrospective,
          :milestones,
          [check_ins: [:author]],
          [contributors: [:person]]
        ]
      ]
    )
  end
end
