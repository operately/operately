defmodule OperatelyWeb.Mcp.Tools.Projects.Pause do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Pause, as: ProjectPause
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "pause_project",
      title: "Pause Project",
      description: "Pauses one project and posts a pause message.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 129,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{
          "title" => "Pause a project",
          "arguments" => %{"project_id" => "project_123", "message" => "Putting this on hold for now."}
        },
        %{
          "title" => "Pause a project and notify people",
          "arguments" => %{
            "project_id" => "project_123",
            "message" => "Putting this on hold for now.",
            "notify_person_ids" => ["person_123"]
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "message" => JsonSchema.string("The pause message in plain text or markdown."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this pause. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this project. Defaults to false."
              )
          },
          required: ["project_id", "message"]
        ),
      output_schema:
        JsonSchema.object(
          %{"project" => JsonSchema.any_object("The paused project.")},
          required: ["project"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id, "message" => message} = arguments) do
    with {:ok, project_id} <- Helpers.decode_id(project_id),
         {:ok, message} <- Helpers.markdown_to_rich_text(message),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      ProjectPause.call(
        conn,
        Map.merge(
          %{
            project_id: project_id,
            message: message
          },
          notification_inputs
        )
      )
    end
  end
end
