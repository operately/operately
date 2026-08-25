defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.Update do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.Update, as: TemplateUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template",
      title: "Update Project Template",
      description: "Updates template metadata or workflow statuses. Omitted fields remain unchanged; explicit null clears nullable metadata.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 234,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template",
          "arguments" => %{"template_id" => "project_template_123", "name" => "Updated launch"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "name" => JsonSchema.string("A replacement name."),
            "description" => JsonSchema.nullable(JsonSchema.string("Markdown description; null clears it.")),
            "duration_days" => JsonSchema.nullable(JsonSchema.integer("Duration in days; null clears it.", minimum: 0)),
            "task_statuses" =>
              JsonSchema.array(
                JsonSchema.object(
                  %{
                    "id" => JsonSchema.string("The stable status ID."),
                    "label" => JsonSchema.string("The display label."),
                    "color" => JsonSchema.string("The status color."),
                    "index" => JsonSchema.integer("The zero-based workflow order.", minimum: 0),
                    "value" => JsonSchema.string("The stable status value."),
                    "closed" => JsonSchema.boolean("Whether tasks in this status are closed.")
                  },
                  required: ["id", "label", "color", "index", "value", "closed"]
                )
              ),
            "deleted_status_replacements" =>
              JsonSchema.array(
                JsonSchema.object(
                  %{
                    "deleted_status_id" => JsonSchema.string("A removed status ID."),
                    "replacement_status_id" => JsonSchema.string("The replacement status ID.")
                  },
                  required: ["deleted_status_id", "replacement_status_id"]
                )
              )
          },
          required: ["template_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("Whether the update succeeded.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, inputs} <- Helpers.put_present(%{id: id}, arguments, "name", :name),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "description", :description, &Helpers.markdown_to_rich_text_nullable/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "duration_days", :duration_days),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "task_statuses", :task_statuses, &Helpers.decode_template_task_statuses/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "deleted_status_replacements", :deleted_status_replacements, &Helpers.decode_status_replacements/1) do
      TemplateUpdate.call(conn, inputs)
    end
  end
end
