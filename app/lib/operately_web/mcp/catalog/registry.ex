defmodule OperatelyWeb.Mcp.Catalog.Registry do
  alias OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Mcp.Catalog.Definition

  def list_definitions do
    list_tool_modules()
    |> Enum.map(&definition_for/1)
    |> Enum.sort_by(&{&1.sort_order, &1.name})
  end

  @doc false
  def list_tool_modules do
    (Application.spec(:operately, :modules) || [])
    |> Enum.filter(&tool_namespace_module?/1)
    |> Enum.filter(&tool_module?/1)
    |> Enum.sort()
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

  defp tool_namespace_module?(module) when is_atom(module) do
    case Module.split(module) do
      ["OperatelyWeb", "Mcp", "Tools", _module | _rest] -> true
      _ -> false
    end
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
