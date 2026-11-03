defmodule Operately.Mcp.Resources do
  use Gettext, backend: OperatelyWeb.Gettext
  @supported_scopes ~w(mcp:read mcp:write)
  @default_scopes ~w(mcp:read mcp:write)

  def supported_scopes, do: @supported_scopes

  def default_scopes, do: @default_scopes

  @doc """
  Narrows the scopes a client requested down to the access level chosen on the consent screen.

  `nil` and `read_write` keep every requested scope. `read` keeps `mcp:read` when the client
  requested it. The result never includes a scope the client did not request.
  """
  def grant_scopes(requested, access_level) when is_list(requested) do
    with {:ok, selected} <- selected_scopes(requested, access_level),
         [_ | _] = scopes <- canonical_scopes(selected) do
      {:ok, scopes}
    else
      _ -> {:error, :invalid_request}
    end
  end

  defp selected_scopes(requested, level) when level in [nil, ""], do: {:ok, requested}
  defp selected_scopes(requested, "read_write"), do: {:ok, requested}

  defp selected_scopes(requested, "read") do
    if "mcp:read" in requested, do: {:ok, ["mcp:read"]}, else: {:error, :invalid_request}
  end

  defp selected_scopes(_requested, _level), do: {:error, :invalid_request}

  defp canonical_scopes(scopes), do: Enum.filter(@supported_scopes, &(&1 in scopes))

  def scope_label("mcp:read"), do: gettext("View workspace data")
  def scope_label("mcp:write"), do: gettext("Create, update, delete, and archive workspace content")
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
