defmodule OperatelyWeb.Plugs.AcmeChallengeSanitizer do
  @moduledoc """
  A plug to handle malformed ACME challenge requests gracefully.
  
  This plug intercepts requests to /.well-known/acme-challenge/* and validates
  that the challenge token follows the expected format before allowing
  SiteEncrypt to process them. This prevents RuntimeError exceptions when
  malformed URLs like /.well-known/acme-challenge/flower.php are requested.
  """
  
  import Plug.Conn

  @behaviour Plug

  @acme_challenge_prefix "/.well-known/acme-challenge/"
  @valid_token_pattern ~r/^[A-Za-z0-9_-]+$/

  def init(opts), do: opts

  def call(conn, _opts) do
    if String.starts_with?(conn.request_path, @acme_challenge_prefix) do
      handle_acme_challenge(conn)
    else
      conn
    end
  end

  defp handle_acme_challenge(conn) do
    token = String.replace_leading(conn.request_path, @acme_challenge_prefix, "")
    
    cond do
      # Empty token or just a trailing slash
      token == "" or token == "/" ->
        send_not_found(conn)
      
      # Token contains file extension (likely malformed)
      String.contains?(token, ".") ->
        send_not_found(conn)
      
      # Token contains URL encoding or other invalid characters
      # ACME challenge tokens should only contain [A-Za-z0-9_-]
      not Regex.match?(@valid_token_pattern, token) ->
        send_not_found(conn)
      
      # Token is too long (ACME tokens are typically 43 characters)
      String.length(token) > 128 ->
        send_not_found(conn)
      
      # Token looks valid, let SiteEncrypt handle it
      true ->
        conn
    end
  end

  defp send_not_found(conn) do
    conn
    |> send_resp(404, "Not Found")
    |> halt()
  end
end