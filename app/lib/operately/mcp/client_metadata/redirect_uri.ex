defmodule Operately.Mcp.ClientMetadata.RedirectUri do
  @moduledoc """
  Validates OAuth redirect URIs for CIMD documents and dynamic client registration.

  Allows:
  - HTTPS URIs with a non-loopback host (browser-hosted MCP clients)
  - HTTP(S) loopback URIs for IDE and CLI clients
  - Private-use URI schemes (RFC 8252) for native desktop apps, when the
    scheme is not on the hard denylist and the path is an OAuth callback path

  Custom schemes such as `cursor://`, `vscode://`, or `windsurf://` are accepted
  when they target a real host/path and use `/oauth/callback` or `/callback`.
  Dangerous schemes (`javascript`, `data`, `file`, etc.) are always rejected.

  Loopback HTTP(S) redirect URIs match registered URIs by scheme, host, path,
  and query, ignoring port (RFC 8252 §7.3). Other URIs must match exactly.
  """

  @localhost_hosts ["localhost", "127.0.0.1", "::1"]

  @denied_schemes ~w(
    javascript data file vbscript about blob
    mailto tel ws wss ftp ftps intent view-source
    http https
  )

  @doc """
  Returns `:ok` when every URI in the list is allowed.
  """
  def validate_all(uris) when is_list(uris) do
    cond do
      uris == [] -> {:error, :invalid_redirect_uri}
      Enum.all?(uris, &allowed?/1) -> :ok
      true -> {:error, :invalid_redirect_uri}
    end
  end

  def allowed?(uri) when is_binary(uri) do
    native_app_redirect?(uri) or https_public?(uri) or loopback?(uri)
  end

  @doc """
  Returns true when `redirect_uri` is registered for the client.

  Non-loopback URIs require an exact string match. Loopback HTTP(S) URIs
  may use any port.
  """
  def registered?(registered_uris, redirect_uri) when is_list(registered_uris) and is_binary(redirect_uri) do
    redirect_uri in registered_uris or Enum.any?(registered_uris, &loopback_match?(&1, redirect_uri))
  end

  def registered?(_, _), do: false

  defp native_app_redirect?(uri) do
    case URI.parse(uri) do
      %URI{scheme: scheme, userinfo: userinfo} = parsed
      when is_binary(scheme) and scheme != "" ->
        scheme = String.downcase(scheme)

        userinfo in [nil, ""] and
          scheme not in @denied_schemes and
          valid_custom_scheme?(scheme) and
          custom_scheme_target?(parsed) and
          oauth_callback_path?(parsed.path)

      _ ->
        false
    end
  end

  defp valid_custom_scheme?(scheme) do
    String.match?(scheme, ~r/^[a-z][a-z0-9+.-]*$/)
  end

  defp custom_scheme_target?(%URI{host: host}) when is_binary(host) and host != "", do: true
  defp custom_scheme_target?(_), do: false

  defp oauth_callback_path?(path) when is_binary(path) do
    path in ["/callback", "/oauth/callback"] or
      String.starts_with?(path, "/callback/") or
      String.starts_with?(path, "/oauth/callback/")
  end

  defp oauth_callback_path?(_), do: false

  defp https_public?(uri) do
    case URI.parse(uri) do
      %URI{scheme: "https", host: host} when is_binary(host) and host != "" ->
        not loopback_host?(host)

      _ ->
        false
    end
  end

  defp loopback?(uri) do
    case URI.parse(uri) do
      %URI{scheme: scheme, host: host}
      when scheme in ["http", "https"] and is_binary(host) ->
        loopback_host?(host)

      _ ->
        false
    end
  end

  defp loopback_match?(registered, requested) do
    loopback?(registered) and loopback?(requested) and loopback_identity(registered) == loopback_identity(requested)
  end

  defp loopback_identity(uri) do
    parsed = URI.parse(uri)
    {parsed.scheme, parsed.host, parsed.path, parsed.query}
  end

  defp loopback_host?(host), do: host in @localhost_hosts
end
