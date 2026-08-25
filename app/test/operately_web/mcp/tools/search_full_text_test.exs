defmodule OperatelyWeb.Mcp.Tools.SearchFullTextTest do
  use Operately.DataCase, async: true

  alias Operately.Search.SourceIndexer
  alias Operately.ShortUuid
  alias Operately.Support.{Factory, RichText}
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.SearchFullText
  alias OperatelyWeb.Paths

  test "call/2 returns indexed document matches" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub,
        name: "Distinctive MCP document",
        content: RichText.rich_text("Distinctive MCP search content")
      )

    assert {:ok, _} = SourceIndexer.sync("resource_hub_document", ctx.document.id)

    assert {:ok, %{results: [result | _]}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Distinctive MCP",
               "types" => ["resource_hub_document"],
               "sort" => "best_match"
             })

    assert result.id == Paths.document_id(ctx.document)
    assert result.type == :resource_hub_document
  end

  test "call/2 returns indexed project matches" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, name: "Distinctive MCP project")

    assert {:ok, _} = SourceIndexer.sync("project", ctx.project.id)

    assert {:ok, %{results: [result | _]}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Distinctive MCP",
               "types" => ["project"],
               "sort" => "best_match"
             })

    assert result.id == ShortUuid.encode!(ctx.project.id)
    assert result.type == :project
  end

  test "call/2 returns indexed goal matches" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, name: "Distinctive MCP goal")

    assert {:ok, _} = SourceIndexer.sync("goal", ctx.goal.id)

    assert {:ok, %{results: [result | _]}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Distinctive MCP",
               "types" => ["goal"],
               "sort" => "best_match"
             })

    assert result.id == ShortUuid.encode!(ctx.goal.id)
    assert result.type == :goal
  end

  test "call/2 returns indexed milestone matches" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project, title: "Distinctive MCP milestone")

    assert {:ok, _} = SourceIndexer.sync("milestone", ctx.milestone.id)

    assert {:ok, %{results: [result | _]}} =
             SearchFullText.call(conn(ctx), %{
               "query" => "Distinctive MCP",
               "types" => ["milestone"],
               "sort" => "best_match"
             })

    assert result.id == ShortUuid.encode!(ctx.milestone.id)
    assert result.type == :milestone
  end

  defp conn(ctx), do: ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)
end
