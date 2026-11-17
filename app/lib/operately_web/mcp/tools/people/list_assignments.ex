defmodule OperatelyWeb.Mcp.Tools.People.ListAssignments do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.People.ListAssignments, as: PeopleListAssignments

  @impl true
  def definition do
    Definition.new!(
      name: "list_assignments",
      title: "List My Assignments",
      description:
        "Lists the authenticated person's assignments in due soon, needs review, and upcoming groups. Includes open tasks, milestones, check-ins, acknowledgements, goal updates, and KPIs.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 22,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "people"},
      examples: [%{"title" => "List my assignments", "arguments" => %{}}],
      input_schema: JsonSchema.object(%{}),
      output_schema:
        JsonSchema.object(
          %{
            "due_soon" => JsonSchema.array(JsonSchema.any_object(), description: "Owner assignments that are overdue, due today, or due soon, grouped by origin."),
            "needs_review" => JsonSchema.array(JsonSchema.any_object(), description: "Reviewer assignments waiting for acknowledgement, grouped by origin."),
            "upcoming" => JsonSchema.array(JsonSchema.any_object(), description: "Owner assignments with a later or missing due date, grouped by origin.")
          },
          required: ["due_soon", "needs_review", "upcoming"]
        )
    )
  end

  @impl true
  def call(conn, _arguments), do: PeopleListAssignments.call(conn, %{})
end
