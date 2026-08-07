defmodule OperatelyWeb.Mcp.Tools.Projects.CreateCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.CreateCheckIn, as: ProjectCreateCheckIn
  alias Operately.RichContent.FromMarkdown
  alias OperatelyWeb.Mcp.Helpers

  @valid_statuses ["on_track", "caution", "off_track"]

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_check_in",
      title: "Create Project Check-In",
      description: "Creates a new project check-in for one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 111,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{
          "title" => "Create a project check-in",
          "arguments" => %{
            "project_id" => "roadmap-project--abc123",
            "status" => "on_track",
            "content" => "We shipped the first milestone."
          }
        },
        %{
          "title" => "Create a check-in and notify people",
          "arguments" => %{
            "project_id" => "roadmap-project--abc123",
            "status" => "caution",
            "content" => "Need help unblocking the release.",
            "notify_person_ids" => ["person_123"],
            "notify_everyone" => false
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "status" => JsonSchema.string("The project status for this check-in.", enum: @valid_statuses),
            "content" => JsonSchema.string("Plain text or simple markdown content for the check-in."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this check-in. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this project. Defaults to false."
              )
          },
          required: ["project_id", "status", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "check_in" => JsonSchema.any_object("The created project check-in.")
          },
          required: ["check_in"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id, "status" => status, "content" => content} = arguments) do
    with {:ok, project_id} <- Helpers.decode_id(project_id),
         {:ok, rich_content} <- FromMarkdown.to_rich_text(content),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      ProjectCreateCheckIn.call(
        conn,
        Map.merge(
          %{
            project_id: project_id,
            status: status,
            description: rich_content,
            post_as_draft: false
          },
          notification_inputs
        )
      )
    end
  end
end
