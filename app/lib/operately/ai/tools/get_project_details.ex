defmodule Operately.AI.Tools.GetProjectDetails do
  alias Operately.AI.Tools.Base

  @doc """
  Provides the markdown details of a project.

  This tool retrieves the current state of the project associated with
  the conversation and returns its markdown representation. The tool uses 
  the conversation author's permissions to access the project data.

  Expected context:
  - :person - The person who started the conversation (for authorization)
  - :project_id - The encoded ID of the project associated with this conversation
  - :agent_run - The agent run context (optional, for logging)
  
  No parameters required - the project_id comes from the conversation context.
  """
  def get_project_details do
    Base.new_tool(%{
      name: "get_project_details",
      description: "Returns the current markdown details of the project associated with this conversation.",
      parameters_schema: %{
        type: "object",
        properties: %{},
        required: []
      },
      function: fn _args, context ->
        me = Map.get(context, :person)
        project_id = Map.get(context, :project_id)

        case project_id do
          nil ->
            {:error, "No project associated with this conversation"}
          
          encoded_id ->
            case decode_project_id(encoded_id) do
              {:ok, id} ->
                case get_project_with_permissions(me, id) do
                  {:ok, project} ->
                    markdown = Operately.MD.Project.render(project)
                    {:ok, markdown}
                  
                  {:error, reason} ->
                    {:error, "Unable to access project: #{reason}"}
                end
              
              {:error, reason} ->
                {:error, "Invalid project ID: #{reason}"}
            end
        end
      end
    })
  end

  # Decode the project ID (similar to get_goal_details pattern)
  defp decode_project_id(project_id) do
    case OperatelyWeb.Api.Helpers.decode_id(project_id) do
      {:ok, id} -> {:ok, id}
      {:error, _} -> {:error, "Invalid project ID format"}
    end
  end

  # Get the project with proper permission checking
  defp get_project_with_permissions(person, project_id) do
    case Operately.Projects.Project.get(person, 
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
    ) do
      {:ok, project} -> {:ok, project}
      {:error, _} -> {:error, "Project not found or access denied"}
    end
  end
end