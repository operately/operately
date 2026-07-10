defmodule Operately.Mcp.ToolsTest do
  use ExUnit.Case, async: true

  alias Operately.Mcp.Resources
  alias OperatelyWeb.Mcp.Catalog.JsonSchema
  alias OperatelyWeb.Mcp.Catalog.Registry
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
    "list_task_statuses",
    "get_space_discussion",
    "search",
    "list_docs_and_files",
    "get_document",
    "get_file",
    "get_link",
    "fetch",
    "create_comment",
    "create_project_check_in",
    "create_goal_check_in",
    "create_project",
    "update_project_name",
    "update_project_description",
    "update_project_start_date",
    "update_project_due_date",
    "update_project_champion",
    "update_project_reviewer",
    "update_project_goal",
    "move_project_to_space",
    "pause_project",
    "resume_project",
    "close_project",
    "acknowledge_project_check_in",
    "acknowledge_project_retrospective",
    "create_project_discussion",
    "update_project_discussion",
    "create_goal",
    "update_goal_name",
    "update_goal_description",
    "update_goal_start_date",
    "update_goal_due_date",
    "update_goal_parent",
    "move_goal_to_space",
    "update_goal_champion",
    "update_goal_reviewer",
    "close_goal",
    "reopen_goal",
    "acknowledge_goal_check_in",
    "acknowledge_goal_retrospective",
    "create_goal_discussion",
    "update_goal_discussion",
    "create_task",
    "update_task_name",
    "update_task_description",
    "update_task_status",
    "update_task_due_date",
    "update_task_assignee",
    "update_task_milestone",
    "create_milestone",
    "update_milestone_title",
    "update_milestone_description",
    "update_milestone_due_date",
    "complete_milestone",
    "reopen_milestone",
    "create_space",
    "update_space",
    "create_space_discussion",
    "update_space_discussion",
    "publish_space_discussion",
    "create_document",
    "update_document",
    "publish_document",
    "create_link",
    "update_link",
    "create_folder",
    "rename_folder",
    "move_resource_hub_item",
    "update_comment",
    "delete_comment",
    "delete_task",
    "delete_project_check_in",
    "delete_goal_check_in",
    "archive_space_discussion",
    "delete_milestone",
    "delete_project",
    "delete_goal",
    "delete_space",
    "delete_document",
    "delete_file",
    "delete_link",
    "delete_folder"
  ]
  @company_modes [:none, :authenticated, :resource_derived]
  @safety_classifications [:read_only, :write, :destructive]

  test "registers the MCP tool catalog" do
    assert Tools.list_definitions() |> Enum.map(& &1.name) == @expected_tool_names
  end

  test "loads tool modules from the compiled application" do
    compiled_modules = Application.spec(:operately, :modules) || []
    tool_modules = Registry.list_tool_modules()

    assert tool_modules != []
    assert Enum.all?(tool_modules, &(&1 in compiled_modules))

    tool_names =
      tool_modules
      |> Enum.map(& &1.definition().name)
      |> Enum.sort()

    assert tool_names == Enum.sort(@expected_tool_names)
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

  test "tool scopes, safety classifications, and company modes match the current catalog" do
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
    assert tools["create_comment"].company_mode == :resource_derived
    assert tools["create_project_check_in"].company_mode == :resource_derived
    assert tools["create_goal_check_in"].company_mode == :resource_derived
    assert tools["create_goal"].company_mode == :resource_derived
    assert tools["create_task"].company_mode == :resource_derived
    assert tools["create_space"].company_mode == :authenticated

    read_only_tools =
      tools
      |> Map.values()
      |> Enum.filter(&(&1.safety_classification == :read_only))

    write_tools =
      tools
      |> Map.values()
      |> Enum.filter(&(&1.safety_classification == :write))

    assert Enum.all?(read_only_tools, &(&1.required_scopes == ["mcp:read"]))
    assert Enum.all?(read_only_tools, &(&1.annotations["readOnlyHint"] == true))
    assert Enum.all?(write_tools, &(&1.required_scopes == ["mcp:write"]))
    assert Enum.all?(write_tools, &(&1.annotations["readOnlyHint"] == false))
    assert Enum.all?(write_tools, &(&1.annotations["destructiveHint"] == false))

    destructive_tools =
      tools
      |> Map.values()
      |> Enum.filter(&(&1.safety_classification == :destructive))

    assert Enum.all?(destructive_tools, &(&1.required_scopes == ["mcp:write"]))
    assert Enum.all?(destructive_tools, &(&1.annotations["destructiveHint"] == true))
    assert Enum.all?(destructive_tools, &(&1.annotations["readOnlyHint"] == false))
  end

  test "any_object schemas include an empty properties map" do
    assert JsonSchema.any_object() == %{
             "type" => "object",
             "properties" => %{},
             "additionalProperties" => true
           }
  end

  test "serializes descriptors for MCP clients" do
    descriptors = Tools.list_descriptors()
    assert Enum.map(descriptors, & &1["name"]) == @expected_tool_names

    assert Enum.all?(descriptors, fn descriptor ->
             match?([_ | _], descriptor["securitySchemes"])
           end)

    assert Enum.all?(descriptors, fn descriptor ->
             schemas_have_object_properties?(descriptor["inputSchema"]) and
               schemas_have_object_properties?(descriptor["outputSchema"])
           end)

    assert %{
             "title" => "Search Operately",
             "description" => _description,
             "inputSchema" => %{"type" => "object"},
             "outputSchema" => %{"type" => "object"},
             "securitySchemes" => [%{"type" => "oauth2", "scopes" => ["mcp:read"]}],
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

    create_comment = Enum.find(descriptors, &(&1["name"] == "create_comment"))

    assert create_comment["annotations"] == %{
             "readOnlyHint" => false,
             "destructiveHint" => false,
             "openWorldHint" => false
           }

    assert create_comment["securitySchemes"] == [%{"type" => "oauth2", "scopes" => ["mcp:write"]}]

    assert Enum.sort(create_comment["inputSchema"]["properties"]["parent_type"]["enum"]) == Enum.sort([
             "goal_check_in",
             "project_check_in",
             "goal_discussion",
             "project_discussion",
             "space_discussion",
             "milestone",
             "document",
             "file",
             "link",
             "project_task",
             "space_task"
           ])

    assert create_comment["_meta"]["securitySchemes"] == [%{"type" => "oauth2", "scopes" => ["mcp:write"]}]
    assert create_comment["_meta"]["safetyClassification"] == "write"

    create_goal = Enum.find(descriptors, &(&1["name"] == "create_goal"))

    assert create_goal["annotations"] == %{
             "readOnlyHint" => false,
             "destructiveHint" => false,
             "openWorldHint" => false
           }

    assert create_goal["_meta"]["requiredScopes"] == ["mcp:write"]
    assert create_goal["inputSchema"]["required"] == ["space_id", "name"]

    create_task = Enum.find(descriptors, &(&1["name"] == "create_task"))

    assert create_task["annotations"] == %{
             "readOnlyHint" => false,
             "destructiveHint" => false,
             "openWorldHint" => false
           }

    assert create_task["_meta"]["requiredScopes"] == ["mcp:write"]
    assert create_task["inputSchema"]["required"] == ["name"]

    delete_task = Enum.find(descriptors, &(&1["name"] == "delete_task"))

    assert delete_task["annotations"] == %{
             "readOnlyHint" => false,
             "destructiveHint" => true,
             "openWorldHint" => false
           }

    assert delete_task["securitySchemes"] == [%{"type" => "oauth2", "scopes" => ["mcp:write"]}]
    assert delete_task["_meta"]["safetyClassification"] == "destructive"
    assert delete_task["inputSchema"]["required"] == ["task_id"]
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

  defp schemas_have_object_properties?(%{"type" => "object"} = schema) do
    is_map(Map.get(schema, "properties", %{})) and
      Enum.all?(Map.get(schema, "properties", %{}), fn {_key, nested} ->
        schemas_have_object_properties?(nested)
      end) and
      case Map.get(schema, "items") do
        %{} = items -> schemas_have_object_properties?(items)
        _ -> true
      end
  end

  defp schemas_have_object_properties?(%{"type" => "array", "items" => items}) when is_map(items) do
    schemas_have_object_properties?(items)
  end

  defp schemas_have_object_properties?(_schema), do: true
end
