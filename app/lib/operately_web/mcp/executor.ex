defmodule OperatelyWeb.Mcp.Executor do
  @moduledoc """
  Resolves catalog entries, validates arguments, and executes MCP tool wrappers.
  """

  alias Plug.Conn
  alias OperatelyWeb.Mcp.Catalog.Definition
  alias OperatelyWeb.Mcp.{InputValidator, Tools}

  @type result :: {:ok, map()} | {:error, term()}

  @doc """
  Resolves a tool definition by name.
  """
  def fetch_definition(name) when is_binary(name) do
    case Tools.find_definition(name) do
      %Definition{} = definition -> {:ok, definition}
      nil -> {:error, :unknown_tool}
    end
  end

  @doc """
  Executes a resolved tool definition and normalizes the result into MCP
  `tools/call` shape.
  """
  def execute(%Conn{} = conn, %Definition{} = definition, arguments) do
    with :ok <- InputValidator.validate(definition.input_schema, arguments),
         :ok <- ensure_authenticated_conn(conn),
         {:ok, result} <- execute_definition(conn, definition, arguments) do
      {:ok, result}
    end
  end

  defp execute_definition(conn, definition, arguments) do
    case definition.implementation.call(conn, arguments) do
      {:ok, payload} -> {:ok, success_result(payload)}
      {:error, :not_implemented} -> {:ok, not_implemented_result(definition.name)}
      error -> error
    end
  end

  defp ensure_authenticated_conn(conn) do
    account = conn.assigns[:current_account]
    company = conn.assigns[:current_company]
    person = conn.assigns[:current_person]

    if account && company && person, do: :ok, else: {:error, :authenticated_conn_required}
  end

  defp success_result(payload) when is_map(payload) do
    %{
      "structuredContent" => stringify_keys(payload),
      "content" => []
    }
  end

  defp not_implemented_result(name) do
    %{
      "isError" => true,
      "content" => [
        %{
          "type" => "text",
          "text" => "The #{name} tool is not implemented yet."
        }
      ]
    }
  end

  defp stringify_keys(value) when is_map(value) do
    Map.new(value, fn {key, nested_value} ->
      normalized_key =
        case key do
          key when is_atom(key) -> Atom.to_string(key)
          key -> key
        end

      {normalized_key, stringify_keys(nested_value)}
    end)
  end

  defp stringify_keys(values) when is_list(values), do: Enum.map(values, &stringify_keys/1)
  defp stringify_keys(value), do: value
end
