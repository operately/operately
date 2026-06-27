defmodule OperatelyWeb.Mcp.Tools.Projects.AcknowledgeCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.AcknowledgeCheckIn, as: ProjectAcknowledgeCheckIn
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "acknowledge_project_check_in",
      title: "Acknowledge Project Check-In",
      description: "Acknowledges one project check-in.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 132,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Acknowledge a project check-in", "arguments" => %{"check_in_id" => "check_in_123"}}],
      input_schema:
        JsonSchema.object(
          %{"check_in_id" => JsonSchema.string("The project check-in identifier.")},
          required: ["check_in_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"check_in" => JsonSchema.any_object("The acknowledged check-in.")},
          required: ["check_in"]
        )
    )
  end

  @impl true
  def call(conn, %{"check_in_id" => check_in_id}) do
    with {:ok, check_in_id} <- Helpers.decode_id(check_in_id) do
      ProjectAcknowledgeCheckIn.call(conn, %{id: check_in_id})
    end
  end
end
