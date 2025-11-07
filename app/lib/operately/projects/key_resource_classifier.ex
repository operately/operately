defmodule Operately.Projects.KeyResourceClassifier do
  @moduledoc """
  Classifies project key resources based on their link so we can display
  context-aware icons and copy throughout the app.
  """

  @type resource_type :: String.t()

  @github_hosts ["github.com"]
  @slack_hosts ["slack.com", "slack-redir.net"]
  @discord_hosts ["discord.com", "discord.gg"]

  @spec classify(String.t() | nil) :: resource_type
  def classify(nil), do: "generic"
  def classify(link) when is_binary(link) do
    normalized = String.downcase(link)

    cond do
      host_matches?(normalized, @github_hosts) -> "github-repository"
      host_matches?(normalized, @slack_hosts) -> "slack-channel"
      host_matches?(normalized, @discord_hosts) -> "discord-channel"
      true -> "generic"
    end
  end

  defp host_matches?(link, hosts) do
    case extract_host(link) do
      nil -> false
      host -> Enum.any?(hosts, &String.contains?(host, &1))
    end
  end

  defp extract_host(link) do
    link
    |> ensure_scheme()
    |> URI.parse()
    |> Map.get(:host)
  rescue
    _ -> nil
  end

  defp ensure_scheme(link) do
    if String.contains?(link, "://") do
      link
    else
      "https://" <> link
    end
  end
end
