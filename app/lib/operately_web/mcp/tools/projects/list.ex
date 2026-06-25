defmodule OperatelyWeb.Mcp.Tools.Projects.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Api.Projects.List, as: ProjectsList

  @impl true
  def definition do
    Definition.new!(
      name: "list_projects",
      title: "List Projects",
      description: "Lists projects in the authenticated company with optional filters.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 30,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{"title" => "List all visible projects", "arguments" => %{}},
        %{"title" => "List my projects in one space", "arguments" => %{"space_id" => "space_123", "only_my_projects" => true}}
      ],
      input_schema:
        JsonSchema.object(%{
          "space_id" => JsonSchema.string("Optional space identifier used to filter projects."),
          "goal_id" => JsonSchema.string("Optional goal identifier used to filter projects."),
          "only_my_projects" => JsonSchema.boolean("When true, return only projects where I am a champion or contributor."),
          "only_reviewed_by_me" => JsonSchema.boolean("When true, return only projects where I am the reviewer.")
        }),
      output_schema:
        JsonSchema.object(
          %{
            "projects" => JsonSchema.array(JsonSchema.any_object(), description: "The matching projects.")
          },
          required: ["projects"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_optional_id(arguments["space_id"]),
         {:ok, goal_id} <- Helpers.decode_optional_id(arguments["goal_id"]) do
      ProjectsList.call(
        conn,
        %{}
        |> Helpers.put_optional(:space_id, space_id)
        |> Helpers.put_optional(:goal_id, goal_id)
        |> Helpers.put_optional(:only_my_projects, arguments["only_my_projects"])
        |> Helpers.put_optional(:only_reviewed_by_me, arguments["only_reviewed_by_me"])
      )
    end
  end
end
