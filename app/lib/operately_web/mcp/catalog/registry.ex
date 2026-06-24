defmodule OperatelyWeb.Mcp.Catalog.Registry do
  alias OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Mcp.Catalog.Definition

  @tool_namespace "Elixir.OperatelyWeb.Mcp.Tools."

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
    case :application.get_key(:operately, :modules) do
      {:ok, modules} -> Enum.filter(modules, &tool_module?/1)
      :undefined -> []
    end
  end

  defp tool_module?(module) do
    Code.ensure_loaded?(module) and
      mcp_tool_namespace?(module) and
      implements_tool_behavior?(module) and
      function_exported?(module, :definition, 0) and
      function_exported?(module, :call, 2)
  end

  defp mcp_tool_namespace?(module) do
    module
    |> Atom.to_string()
    |> String.starts_with?(@tool_namespace)
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
