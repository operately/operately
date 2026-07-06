defmodule Operately.Mcp.Resources do
  @supported_scopes ~w(mcp:read mcp:write)
  @default_scopes ~w(mcp:read)

  def supported_scopes, do: @supported_scopes

  def default_scopes, do: @default_scopes

  def scope_label("mcp:read"), do: "View workspace data"
  def scope_label("mcp:write"), do: "Create, update, delete, and archive workspace content"
  def scope_label(scope) when is_binary(scope), do: scope

  def canonical_resource_uri do
    normalize_resource_uri(OperatelyWeb.Endpoint.url() <> "/mcp")
  end

  def normalize_resource_uri(uri) when is_binary(uri) do
    uri
    |> String.trim()
    |> String.trim_trailing("/")
    |> case do
      "" -> ""
      normalized -> normalized
    end
  end

  def resource_valid?(resource) when is_binary(resource) do
    normalize_resource_uri(resource) == canonical_resource_uri()
  end

  def resource_valid?(_), do: false

  def scopes_to_string(scopes) when is_list(scopes), do: Enum.join(scopes, " ")

  def parse_scopes(nil), do: {:ok, @default_scopes}
  def parse_scopes(""), do: {:ok, @default_scopes}

  def parse_scopes(scopes) when is_binary(scopes) do
    scopes
    |> String.split(~r/\s+/, trim: true)
    |> parse_scopes()
  end

  def parse_scopes(scopes) when is_list(scopes) do
    scopes = scopes |> Enum.map(&to_string/1) |> Enum.uniq()

    if scopes == [] do
      {:ok, @default_scopes}
    else
      invalid_scopes = Enum.reject(scopes, &(&1 in @supported_scopes))

      if invalid_scopes == [] do
        {:ok, scopes}
      else
        {:error, :invalid_scope}
      end
    end
  end
end
