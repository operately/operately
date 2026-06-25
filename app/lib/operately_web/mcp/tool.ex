defmodule OperatelyWeb.Mcp.Tool do
  @moduledoc """
  Behaviour for MCP tool wrappers.

  A wrapper owns MCP-facing metadata and argument shaping, while shared Operately
  domain/query/service modules remain the execution source of truth.
  """

  alias OperatelyWeb.Mcp.Catalog.Definition

  @type conn :: Plug.Conn.t()
  @type arguments :: map()
  @type result :: {:ok, map()} | {:error, term()}

  @callback definition() :: Definition.t()
  @callback call(conn(), arguments()) :: result()

  defmacro __using__(_) do
    quote do
      @behaviour OperatelyWeb.Mcp.Tool

      alias OperatelyWeb.Mcp.Catalog.{Definition, JsonSchema}

      import OperatelyWeb.Mcp.Tool, only: [not_implemented: 0, read_annotations: 0, write_annotations: 0, read_security_schemes: 0, write_security_schemes: 0]
    end
  end

  def read_annotations do
    annotations(read_only: true, destructive: false)
  end

  def write_annotations do
    annotations(read_only: false, destructive: false)
  end

  def read_security_schemes do
    security_schemes(["mcp:read"])
  end

  def write_security_schemes do
    security_schemes(["mcp:write"])
  end

  def not_implemented, do: {:error, :not_implemented}

  defp annotations(opts) do
    %{
      "readOnlyHint" => Keyword.fetch!(opts, :read_only),
      "destructiveHint" => Keyword.fetch!(opts, :destructive),
      "openWorldHint" => false
    }
  end

  defp security_schemes(scopes) do
    [
      %{
        "type" => "oauth2",
        "scopes" => scopes
      }
    ]
  end
end
