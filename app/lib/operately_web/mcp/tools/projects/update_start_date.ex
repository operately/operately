defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateStartDate do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateStartDate, as: ProjectUpdateStartDate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_start_date",
      title: "Update Project Start Date",
      description: "Updates or clears the start date of one project using an ISO date.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 123,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Change a project start date", "arguments" => %{"project_id" => "project_123", "start_date" => "2026-07-01"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "start_date" => JsonSchema.string("The new ISO date, for example 2026-07-01. Omit it to clear the start date.")
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
         {:ok, start_date} <- Helpers.parse_day_date(arguments["start_date"]) do
      ProjectUpdateStartDate.call(conn, %{project_id: project_id, start_date: start_date})
    end
  end
end
