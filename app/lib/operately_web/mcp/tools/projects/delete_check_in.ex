defmodule OperatelyWeb.Mcp.Tools.Projects.DeleteCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.DeleteCheckIn, as: ProjectDeleteCheckIn
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_project_check_in",
      title: "Delete Project Check-In",
      description: "Permanently deletes one project check-in.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 212,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Delete a project check-in", "arguments" => %{"check_in_id" => "check_in_123"}}],
      input_schema:
        JsonSchema.object(
          %{"check_in_id" => JsonSchema.string("The project check-in identifier.")},
          required: ["check_in_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the check-in is deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"check_in_id" => check_in_id}) do
    with {:ok, check_in_id} <- Helpers.decode_id(check_in_id),
         {:ok, %{success: true}} <- ProjectDeleteCheckIn.call(conn, %{check_in_id: check_in_id}) do
      {:ok, %{success: true}}
    end
  end
end
