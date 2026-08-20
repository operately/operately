defmodule Operately.ProductReleases.ParserTest do
  use ExUnit.Case, async: true

  alias Operately.ProductReleases.Parser

  defp fixture(name) do
    Path.join([__DIR__, "fixtures", name]) |> File.read!()
  end

  test "returns the newest item even when it is not first" do
    assert {:ok, release} = Parser.parse(fixture("rss.xml"))

    assert release.id == "v1.8"
    assert release.title == "MCP Connections, Scheduled Posts, Retrospective Acknowledgements, and more"
    assert release.published_at == ~U[2026-07-17 00:00:00Z]
    assert release.teaser == "Bring AI into your work, prepare updates ahead of time, and review goal and project outcomes."
  end

  test "parses the official marketing feed" do
    assert {:ok, release} = Parser.parse(fixture("operately.xml"))

    assert release.id == "https://operately.com/releases/v180"
    assert release.title == "MCP Connections, Scheduled Posts, Retrospective Acknowledgements, and more"
    assert release.published_at == ~U[2026-07-17 00:00:00Z]

    assert release.teaser ==
             "Operately v1.8 introduces MCP connections for AI clients, scheduled discussions and check-ins, retrospective acknowledgements, and workflow improvements across projects and Docs & Files."
  end

  test "returns nil for an empty feed" do
    assert {:ok, nil} = Parser.parse(fixture("empty.xml"))
  end

  test "returns invalid_feed for malformed xml" do
    assert {:error, :invalid_feed} = Parser.parse(fixture("malformed.xml"))
  end

  test "strips html from title and teaser" do
    assert {:ok, release} = Parser.parse(fixture("html.xml"))

    assert release.title == "Operately v1.8 is here"
    assert release.teaser == "Bring AI into your work. Sign up for Operately"
  end
end
