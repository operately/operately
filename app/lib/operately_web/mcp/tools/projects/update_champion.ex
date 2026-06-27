defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateChampion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateChampion, as: ProjectUpdateChampion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_champion",
      title: "Update Project Champion",
      description: "Updates or clears the champion of one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 125,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Assign a champion", "arguments" => %{"project_id" => "project_123", "champion_id" => "person_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "champion_id" => JsonSchema.string("The new champion person identifier. Omit it to clear the champion.")
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
         {:ok, champion_id} <- Helpers.decode_optional_id(arguments["champion_id"]) do
      ProjectUpdateChampion.call(conn, %{project_id: project_id, champion_id: champion_id})
    end
  end
end
