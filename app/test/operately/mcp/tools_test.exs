defmodule Operately.Mcp.ToolsTest do
  use ExUnit.Case, async: true

  alias Operately.Mcp.Resources
  alias OperatelyWeb.Mcp.Tools

  @expected_tool_names [
    "get_current_company",
    "get_me",
    "list_people",
    "get_person",
    "list_spaces",
    "get_space",
    "list_projects",
    "get_project",
    "get_milestone",
    "list_milestone_tasks",
    "list_project_discussions",
    "get_project_discussion",
    "list_project_check_ins",
    "get_project_check_in",
    "list_goals",
    "list_goal_discussions",
    "list_goal_check_ins",
    "get_goal",
    "get_goal_check_in",
    "list_tasks",
    "get_task",
    "list_space_discussions",
    "get_space_discussion",
    "search",
    "list_docs_and_files",
    "get_document",
    "get_file",
    "get_link",
    "fetch"
  ]
  @company_modes [:none, :authenticated, :resource_derived]
  @safety_classifications [:read_only, :write, :destructive]

  test "registers the read-only tool catalog" do
    assert Tools.list_definitions() |> Enum.map(& &1.name) == @expected_tool_names
  end

  test "tool catalog satisfies definition invariants" do
    tools = Tools.list_definitions()

    assert Enum.all?(tools, &(is_binary(&1.name) and &1.name != ""))
    assert Enum.uniq_by(tools, & &1.name) == tools

    assert Enum.all?(tools, &(is_binary(&1.title) and &1.title != ""))
    assert Enum.all?(tools, &(is_binary(&1.description) and &1.description != ""))
    assert Enum.all?(tools, &(&1.company_mode in @company_modes))
    assert Enum.all?(tools, &(&1.safety_classification in @safety_classifications))
    assert Enum.all?(tools, &(is_integer(&1.sort_order) and &1.sort_order >= 0))

    assert Enum.all?(tools, &is_map(&1.annotations))
    assert Enum.all?(tools, &is_list(&1.security_schemes))
    assert Enum.all?(tools, &is_map(&1.discovery_metadata))
    assert Enum.all?(tools, &is_atom(&1.implementation))
    assert Enum.all?(tools, &function_exported?(&1.implementation, :call, 2))

    assert Enum.all?(tools, fn tool ->
             is_list(tool.required_scopes) and Enum.all?(tool.required_scopes, &(&1 in Resources.supported_scopes()))
           end)

    assert Enum.all?(tools, fn tool ->
             is_list(tool.examples) and Enum.all?(tool.examples, &valid_example?/1)
           end)

    assert Enum.all?(tools, &valid_object_schema?(&1.input_schema, forbid_company_id: true))
    assert Enum.all?(tools, &valid_object_schema?(&1.output_schema))
  end

  test "read-only tool scopes and company modes match the current catalog" do
    tools =
      Tools.list_definitions()
      |> Map.new(&{&1.name, &1})

    assert tools["get_current_company"].company_mode == :authenticated
    assert tools["get_me"].company_mode == :authenticated
    assert tools["list_projects"].company_mode == :authenticated
    assert tools["get_project"].company_mode == :resource_derived
    assert tools["list_goals"].company_mode == :authenticated
    assert tools["get_goal"].company_mode == :resource_derived
    assert tools["list_tasks"].company_mode == :authenticated
    assert tools["get_task"].company_mode == :resource_derived
    assert tools["search"].company_mode == :authenticated
    assert tools["fetch"].company_mode == :resource_derived

    assert Enum.all?(Map.values(tools), &(&1.required_scopes == ["mcp:read"]))
  end

  test "serializes descriptors for MCP clients" do
    descriptors = Tools.list_descriptors()
    assert Enum.map(descriptors, & &1["name"]) == @expected_tool_names

    assert %{
             "title" => "Search Operately",
             "description" => _description,
             "inputSchema" => %{"type" => "object"},
             "outputSchema" => %{"type" => "object"},
             "annotations" => %{
               "readOnlyHint" => true,
               "destructiveHint" => false,
               "openWorldHint" => false
             },
             "_meta" => %{
               "securitySchemes" => [%{"type" => "oauth2", "scopes" => ["mcp:read"]}],
               "examples" => [_ | _],
               "companyMode" => "authenticated",
               "safetyClassification" => "read_only"
             }
           } = Enum.find(descriptors, &(&1["name"] == "search"))
  end

  defp valid_example?(%{"title" => title, "arguments" => arguments}) when is_binary(title) and title != "" and is_map(arguments), do: true
  defp valid_example?(%{title: title, arguments: arguments}) when is_binary(title) and title != "" and is_map(arguments), do: true
  defp valid_example?(_example), do: false

  defp valid_object_schema?(schema, opts \\ [])

  defp valid_object_schema?(%{"type" => "object"} = schema, opts) do
    properties = Map.get(schema, "properties", %{})
    required = Map.get(schema, "required", [])
    forbid_company_id = Keyword.get(opts, :forbid_company_id, false)

    is_map(properties) and
      is_list(required) and
      Enum.all?(required, &Map.has_key?(properties, &1)) and
      (not forbid_company_id or not Map.has_key?(properties, "company_id"))
  end

  defp valid_object_schema?(_schema, _opts), do: false
end
