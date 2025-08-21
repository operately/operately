defmodule Operately.AI.Tools.GetProjectDescription do
  alias Operately.AI.Tools.Base

  @doc """
  Provides the markdown description of a project.

  This tool retrieves the current state of the project associated with the conversation
  and returns its markdown representation. The tool uses the conversation author's
  permissions to access the project data.

  Expected context:
  - :person - The person who started the conversation (for authorization)
  - :agent_run - The agent run context (optional, for logging)
  """
  def get_project_description do
    Base.new_tool(%{
      name: "get_project_description",
      description: "Returns the current markdown description of the project associated with this conversation.",
      parameters_schema: %{
        type: "object",
        properties: %{},
        required: []
      },
      function: fn _args, context ->
        me = Map.get(context, :person)

        # The project ID should be available from the conversation context
        # We'll need to get it from the conversation record
        case get_project_from_context(context) do
          {:ok, project_id} ->
            case get_project_with_permissions(me, project_id) do
              {:ok, project} ->
                markdown = Operately.MD.Project.render(project)
                {:ok, markdown}
              
              {:error, reason} ->
                {:error, "Unable to access project: #{reason}"}
            end
          
          {:error, reason} ->
            {:error, "Unable to find project context: #{reason}"}
        end
      end
    })
  end

  # Get the project ID from the conversation context
  # This will need to be passed in via the context or retrieved from the conversation
  defp get_project_from_context(context) do
    cond do
      # Check if project_id is directly available in context
      Map.has_key?(context, :project_id) ->
        {:ok, context.project_id}
      
      true ->
        {:error, "No project context available - this conversation is not associated with a project"}
    end
  end

  # This function is no longer needed but kept for clarity
  defp get_conversation_project_id(_agent_run) do
    # This is no longer used since we get project_id directly from context
    nil
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