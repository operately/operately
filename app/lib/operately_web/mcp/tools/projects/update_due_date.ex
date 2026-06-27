defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateDueDate do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateDueDate, as: ProjectUpdateDueDate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_due_date",
      title: "Update Project Due Date",
      description: "Updates or clears the due date of one project using an ISO date.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 124,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Change a project due date", "arguments" => %{"project_id" => "project_123", "due_date" => "2026-08-01"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "due_date" => JsonSchema.string("The new ISO date, for example 2026-08-01. Omit it to clear the due date.")
          },
          required: ["project_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the update succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]),
         {:ok, due_date} <- Helpers.parse_day_date(arguments["due_date"]) do
      ProjectUpdateDueDate.call(conn, %{project_id: project_id, due_date: due_date})
    end
  end
end
