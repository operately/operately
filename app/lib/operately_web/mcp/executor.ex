defmodule OperatelyWeb.Mcp.Executor do
  @moduledoc """
  Resolves catalog entries, validates arguments, and executes MCP tool wrappers.
  """

  alias Jason.EncodeError
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
      {:ok, payload} when is_map(payload) -> {:ok, success_result(payload)}
      {:ok, _payload} -> {:ok, internal_error_result()}
      {:error, :invalid_arguments} = error -> error
      {:error, :not_implemented} -> {:ok, not_implemented_result(definition.name)}
      {:error, :not_found} -> {:ok, not_found_result()}
      {:error, :forbidden} -> {:ok, forbidden_result()}
      {:error, :bad_request} -> {:ok, bad_request_result()}
      {:error, :internal_server_error} -> {:ok, internal_error_result()}
      {:error, _reason} -> {:ok, internal_error_result()}
    end
  end

  defp ensure_authenticated_conn(conn) do
    account = conn.assigns[:current_account]
    company = conn.assigns[:current_company]
    person = conn.assigns[:current_person]

    if account && company && person, do: :ok, else: {:error, :authenticated_conn_required}
  end

  defp success_result(payload) when is_map(payload) do
    structured_content = stringify_keys(payload)

    %{
      "structuredContent" => structured_content,
      "content" => [text_content(encode_json!(structured_content))]
    }
  end

  defp not_implemented_result(name) do
    %{
      "isError" => true,
      "content" => [text_content("The #{name} tool is not implemented yet.")]
    }
  end

  defp not_found_result do
    %{
      "isError" => true,
      "content" => [text_content("The requested resource was not found or is not accessible.")]
    }
  end

  defp forbidden_result do
    %{
      "isError" => true,
      "content" => [text_content("You do not have permission to perform this operation, or the company is read-only.")]
    }
  end

  defp bad_request_result do
    %{
      "isError" => true,
      "content" => [text_content("The tool could not complete the request with the provided data.")]
    }
  end

  defp internal_error_result do
    %{
      "isError" => true,
      "content" => [text_content("The tool could not complete the request.")]
    }
  end

  defp text_content(text) do
    %{
      "type" => "text",
      "text" => text
    }
  end

  defp encode_json!(value) do
    Jason.encode!(value)
  rescue
    EncodeError -> "{}"
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
