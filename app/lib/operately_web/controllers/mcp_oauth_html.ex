defmodule OperatelyWeb.McpOAuthHTML do
  use Gettext, backend: OperatelyWeb.Gettext
  use OperatelyWeb, :html

  # Only the application-owned client tag becomes markup; names and catalog text are escaped.
  def access_choice?(scopes) when is_list(scopes) do
    "mcp:read" in scopes and "mcp:write" in scopes
  end

  def client_sentence(sentence, client_name) do
    sentence
    |> String.split("<client/>")
    |> Enum.intersperse({:safe, ["<strong>", Phoenix.HTML.Safe.to_iodata(client_name), "</strong>"]})
    |> Phoenix.HTML.html_escape()
  end

  embed_templates "mcp_oauth_html/*"
end
