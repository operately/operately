defmodule OperatelyWeb.Mcp.Catalog.Registry do
  alias OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Mcp.Catalog.Definition

  @tools_dir Path.expand("../tools", __DIR__)
  @tool_base OperatelyWeb.Mcp.Tools
  @tool_files Path.wildcard(Path.join(@tools_dir, "**/*.ex"))

  for file <- @tool_files do
    @external_resource file
  end

  def list_definitions do
    tool_modules()
    |> Enum.map(&definition_for/1)
    |> Enum.sort_by(&{&1.sort_order, &1.name})
  end

  def find_definition(name) when is_binary(name) do
    Enum.find(list_definitions(), &(&1.name == name))
  end

  defp definition_for(module) do
    module.definition()
    |> attach_implementation(module)
  end

  defp attach_implementation(%Definition{} = definition, module) do
    %{definition | implementation: module}
  end

  defp tool_modules do
    @tool_files
    |> Enum.map(&module_for_tool_file/1)
    |> Enum.filter(&tool_module?/1)
    |> Enum.sort()
  end

  defp module_for_tool_file(file) do
    file
    |> Path.relative_to(@tools_dir)
    |> Path.rootname()
    |> Path.split()
    |> Enum.map(&Macro.camelize/1)
    |> then(&Module.concat([@tool_base | &1]))
  end

  defp tool_module?(module) do
    Code.ensure_loaded?(module) and
      implements_tool_behavior?(module) and
      function_exported?(module, :definition, 0) and
      function_exported?(module, :call, 2)
  end

  defp implements_tool_behavior?(module) do
    module
    |> module_behaviors()
    |> Enum.member?(Tool)
  end

  defp module_behaviors(module) do
    module.module_info(:attributes)
    |> Keyword.get_values(:behaviour)
    |> List.flatten()
  end
end
