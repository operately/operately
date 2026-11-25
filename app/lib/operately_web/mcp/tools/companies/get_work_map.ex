defmodule OperatelyWeb.Mcp.Tools.Companies.GetWorkMap do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Companies.GetWorkMap, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "get_work_map",
      title: "Get Work Map",
      description: "Returns the accessible goal and project hierarchy in the connected company. Optionally filter by space, parent goal, or people. Set only_completed to filter for completed work.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 99,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "companies"},
      examples: [%{"title" => "Get Work Map", "arguments" => %{}}, %{"title" => "Get space work with cross-space parent goals", "arguments" => %{"space_id" => "<space-id>", "include_cross_space_parents" => true}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("Optional space id."),
            "parent_goal_id" => JsonSchema.string("Optional parent goal id."),
            "champion_id" => JsonSchema.string("Optional champion id."),
            "reviewer_id" => JsonSchema.string("Optional reviewer id."),
            "contributor_id" => JsonSchema.string("Optional contributor id."),
            "only_completed" => JsonSchema.boolean("Return only completed work when true; defaults to false."),
            "include_assignees" => JsonSchema.boolean("Include assignees; defaults to false."),
            "include_cross_space_parents" => JsonSchema.boolean("Keep visible parent goals from other spaces for paused and completed work; defaults to false."),
            "include_reviewer" => JsonSchema.boolean("Include reviewers; defaults to false.")
          },
          required: []
        ),
      output_schema: JsonSchema.object(%{"work_map" => JsonSchema.array(JsonSchema.any_object("A work item with its children."))}, required: ["work_map"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- Helpers.put_present(%{}, arguments, "space_id", :space_id, &Helpers.decode_optional_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "parent_goal_id", :parent_goal_id, &Helpers.decode_optional_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "champion_id", :champion_id, &Helpers.decode_optional_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "reviewer_id", :reviewer_id, &Helpers.decode_optional_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "contributor_id", :contributor_id, &Helpers.decode_optional_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "only_completed", :only_completed, &Inputs.boolean/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "include_cross_space_parents", :include_cross_space_parents, &Inputs.boolean/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "include_assignees", :include_assignees, &Inputs.boolean/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "include_reviewer", :include_reviewer, &Inputs.boolean/1) do
      Api.call(conn, inputs)
    end
  end
end
