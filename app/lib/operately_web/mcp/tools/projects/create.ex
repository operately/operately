defmodule OperatelyWeb.Mcp.Tools.Projects.Create do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Create, as: ProjectCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_project",
      title: "Create Project",
      description: "Creates a new project in one space using the standard Operately access defaults for that space.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 120,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{
          "title" => "Create a project in a space",
          "arguments" => %{
            "space_id" => "space_123",
            "name" => "Improve onboarding",
            "description" => "Reduce time to first value for new members."
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The space where the project will be created."),
            "name" => JsonSchema.string("The project name."),
            "champion_id" => JsonSchema.string("An optional champion person identifier."),
            "reviewer_id" => JsonSchema.string("An optional reviewer person identifier."),
            "goal_id" => JsonSchema.string("An optional parent goal identifier."),
            "description" => JsonSchema.string("An optional plain text or markdown project description.")
          },
          required: ["space_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"project" => JsonSchema.any_object("The created project.")},
          required: ["project"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]),
         {:ok, description} <- decode_optional_description(arguments["description"]),
         {:ok, champion_id} <- Helpers.decode_optional_id(arguments["champion_id"]),
         {:ok, reviewer_id} <- Helpers.decode_optional_id(arguments["reviewer_id"]),
         {:ok, goal_id} <- Helpers.decode_optional_id(arguments["goal_id"]),
         {:ok, space} <- Helpers.load_space_with_access_levels(conn.assigns.current_person, space_id) do
      defaults = Helpers.default_nested_access_levels(space)

      ProjectCreate.call(conn, %{
        space_id: space_id,
        name: arguments["name"],
        champion_id: champion_id,
        reviewer_id: reviewer_id,
        goal_id: goal_id,
        description: description,
        anonymous_access_level: defaults.anonymous,
        company_access_level: defaults.company,
        space_access_level: defaults.space
      })
    end
  end

  defp decode_optional_description(nil), do: {:ok, nil}
  defp decode_optional_description(description), do: Helpers.markdown_to_rich_text_allow_blank(description)
end
