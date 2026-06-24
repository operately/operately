defmodule OperatelyWeb.Mcp.Tool do
  @moduledoc """
  Behaviour for MCP tool wrappers.

  A wrapper owns MCP-facing metadata and argument shaping, while shared Operately
  domain/query/service modules remain the execution source of truth.
  """

  alias OperatelyWeb.Mcp.Catalog.Definition

  @type context :: map()
  @type arguments :: map()
  @type result :: {:ok, map()} | {:error, term()}

  @callback definition() :: Definition.t()
  @callback call(context(), arguments()) :: result()

  defmacro __using__(_) do
    quote do
      @behaviour OperatelyWeb.Mcp.Tool

      alias OperatelyWeb.Mcp.Catalog.{Definition, JsonSchema}

      import OperatelyWeb.Mcp.Tool, only: [not_implemented: 0, read_annotations: 0, read_security_schemes: 0]
    end
  end

  def read_annotations do
    %{
      "readOnlyHint" => true,
      "destructiveHint" => false,
      "openWorldHint" => false
    }
  end

  def read_security_schemes do
    [
      %{
        "type" => "oauth2",
        "scopes" => ["mcp:read"]
      }
    ]
  end

  def not_implemented, do: {:error, :not_implemented}
end
