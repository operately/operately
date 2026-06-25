defmodule OperatelyWeb.Mcp.Tools.Projects.GetCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.GetCheckIn, as: ProjectCheckInGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_project_check_in",
      title: "Get Project Check-In",
      description: "Returns one project check-in by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 50,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Open a project check-in by ID", "arguments" => %{"check_in_id" => "project_check_in_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "check_in_id" => JsonSchema.string("The project check-in identifier.")
          },
          required: ["check_in_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "check_in" => JsonSchema.any_object("The matching project check-in.")
          },
          required: ["check_in"]
        )
    )
  end

  @impl true
  def call(conn, %{"check_in_id" => check_in_id}) do
    with {:ok, check_in_id} <- Helpers.decode_id(check_in_id),
         {:ok, %{project_check_in: check_in}} <- ProjectCheckInGet.call(conn, %{id: check_in_id}) do
      {:ok, %{check_in: Map.put(check_in, :comments, Helpers.load_comments(conn, check_in_id, :project_check_in))}}
    end
  end
end
