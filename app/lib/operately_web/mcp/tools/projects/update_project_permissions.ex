defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateProjectPermissions do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdatePermissions, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_permissions",
      title: "Update Project Permissions",
      description: "Replaces resource access levels. Requires full access. Supply every level; use no_access to remove access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{
          "title" => "Update project permissions",
          "arguments" => %{"project_id" => "project_123", "access_levels" => %{"public" => "no_access", "company" => "comment_access", "space" => "edit_access"}}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("Project id."),
            "access_levels" => Inputs.levels_schema(true)
          },
          required: ["project_id", "access_levels"]
        ),
      output_schema: JsonSchema.object(%{"success" => JsonSchema.boolean("Operation result.")}, required: ["success"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]),
         {:ok, access_levels} <- Inputs.levels(arguments["access_levels"], true) do
      {:ok, %{project_id: project_id, access_levels: access_levels}}
    end
  end
end
