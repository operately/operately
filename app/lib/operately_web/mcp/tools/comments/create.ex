defmodule OperatelyWeb.Mcp.Tools.Comments.Create do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Comments.Create, as: CommentCreate
  alias Operately.RichContent.FromMarkdown
  alias OperatelyWeb.Mcp.Helpers

  @parent_types %{
    "goal_check_in" => :goal_update,
    "project_check_in" => :project_check_in,
    "goal_discussion" => :goal_discussion,
    "project_discussion" => :project_discussion,
    "space_discussion" => :message,
    "milestone" => :milestone,
    "document" => :resource_hub_document,
    "file" => :resource_hub_file,
    "link" => :resource_hub_link,
    "project_task" => :project_task,
    "space_task" => :space_task
  }

  @impl true
  def definition do
    Definition.new!(
      name: "create_comment",
      title: "Create Comment",
      description: "Creates a comment on a supported Operately resource using its existing MCP resource ID and parent type.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 110,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "comments"},
      examples: [
        %{
          "title" => "Comment on a project discussion",
          "arguments" => %{
            "resource_id" => "roadmap-discussion--abc123",
            "parent_type" => "project_discussion",
            "content" => "Looks good to me."
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "resource_id" => JsonSchema.string("The existing MCP resource identifier to comment on."),
            "parent_type" =>
              JsonSchema.string(
                "The type of resource identified by resource_id.",
                enum: Map.keys(@parent_types)
              ),
            "content" => JsonSchema.string("Plain text or simple markdown content for the comment.")
          },
          required: ["resource_id", "parent_type", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "comment" => JsonSchema.any_object("The created comment.")
          },
          required: ["comment"]
        )
    )
  end

  @impl true
  def call(conn, %{"resource_id" => resource_id, "parent_type" => parent_type, "content" => content}) do
    with {:ok, rich_content} <- FromMarkdown.to_rich_text(content),
         {:ok, entity_type} <- decode_parent_type(parent_type),
         {:ok, entity_id} <- Helpers.decode_id(resource_id) do
      case CommentCreate.call(conn, %{
             entity_id: entity_id,
             entity_type: entity_type,
             content: rich_content
           }) do
        {:ok, %{comment: %{comment: comment}}} -> {:ok, %{comment: comment}}
        result -> result
      end
    end
  end

  defp decode_parent_type(parent_type) when is_binary(parent_type) do
    case Map.fetch(@parent_types, parent_type) do
      {:ok, entity_type} -> {:ok, entity_type}
      :error -> {:error, :invalid_arguments}
    end
  end

  defp decode_parent_type(_parent_type), do: {:error, :invalid_arguments}
end
