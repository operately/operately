defmodule OperatelyWeb.Mcp.Tools.Projects.CreateDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Discussions.Create, as: ProjectCreateDiscussion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_discussion",
      title: "Create Project Discussion",
      description: "Creates a new discussion for one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 133,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{
          "title" => "Start a project discussion",
          "arguments" => %{"project_id" => "project_123", "title" => "Kickoff", "content" => "Let us align on scope."}
        },
        %{
          "title" => "Start a discussion and notify everyone",
          "arguments" => %{
            "project_id" => "project_123",
            "title" => "Kickoff",
            "content" => "Let us align on scope.",
            "notify_everyone" => true
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "title" => JsonSchema.string("The discussion title."),
            "content" => JsonSchema.string("The discussion body in plain text or markdown."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this discussion. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this project. Defaults to false."
              )
          },
          required: ["project_id", "title", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{"discussion" => JsonSchema.any_object("The created discussion.")},
          required: ["discussion"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id, "title" => title, "content" => content} = arguments) do
    with {:ok, project_id} <- Helpers.decode_id(project_id),
         {:ok, content} <- Helpers.markdown_to_rich_text(content),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      ProjectCreateDiscussion.call(
        conn,
        Map.merge(
          %{
            project_id: project_id,
            title: title,
            message: content
          },
          notification_inputs
        )
      )
    end
  end
end
