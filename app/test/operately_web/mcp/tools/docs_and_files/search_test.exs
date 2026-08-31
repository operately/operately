defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.SearchTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.{File, Link}
  alias Operately.Search.SourceIndexer
  alias Operately.Support.{Factory, RichText}
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.Search
  alias OperatelyWeb.Paths

  test "call/2 searches documents in a space hub" do
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

    assert {:ok, %{nodes: [node]}} =
             Search.call(conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "query" => "Distinctive MCP"
             })

    assert node.document.id == Paths.document_id(ctx.document)
    assert node.document.url == Paths.to_url(Paths.document_path(ctx.company, ctx.document))
  end

  test "call/2 searches files in a space hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_file(:file, :hub)
      |> then(&rename_file(&1, "Distinctive MCP file", RichText.rich_text("Distinctive MCP file content")))

    assert {:ok, _} = SourceIndexer.sync("resource_hub_file", ctx.file.id)

    assert {:ok, %{nodes: [node]}} =
             Search.call(conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "query" => "Distinctive MCP"
             })

    assert node.file.id == Paths.file_id(ctx.file)
    assert node.file.url == Paths.to_url(Paths.file_path(ctx.company, ctx.file))
  end

  test "call/2 searches links in a space hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_link(:link, :hub)
      |> then(&rename_link(&1, "Distinctive MCP link", RichText.rich_text("Distinctive MCP link content")))

    assert {:ok, _} = SourceIndexer.sync("resource_hub_link", ctx.link.id)

    assert {:ok, %{nodes: [node]}} =
             Search.call(conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "query" => "Distinctive MCP"
             })

    assert node.link.id == Paths.link_id(ctx.link)
    assert node.link.url == ctx.link.url
    assert node.link.page_url == Paths.to_url(Paths.link_path(ctx.company, ctx.link))
  end

  test "call/2 searches documents in a project hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:hub, :project)
      |> Factory.add_document(:document, :hub,
        name: "Distinctive MCP project document",
        content: RichText.rich_text("Distinctive MCP search content")
      )

    assert {:ok, _} = SourceIndexer.sync("resource_hub_document", ctx.document.id)

    assert {:ok, %{nodes: [node]}} =
             Search.call(conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "query" => "Distinctive MCP"
             })

    assert node.document.id == Paths.document_id(ctx.document)
    assert node.document.url == Paths.to_url(Paths.document_path(ctx.company, ctx.document))
  end

  test "call/2 searches documents in a goal hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.fetch_default_goal_resource_hub(:hub, :goal)
      |> Factory.add_document(:document, :hub,
        name: "Distinctive MCP goal document",
        content: RichText.rich_text("Distinctive MCP search content")
      )

    assert {:ok, _} = SourceIndexer.sync("resource_hub_document", ctx.document.id)

    assert {:ok, %{nodes: [node]}} =
             Search.call(conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "query" => "Distinctive MCP"
             })

    assert node.document.id == Paths.document_id(ctx.document)
    assert node.document.url == Paths.to_url(Paths.document_path(ctx.company, ctx.document))
  end

  test "returns invalid_arguments when hub scope is missing or conflicting" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:error, :invalid_arguments} = Search.call(conn(ctx), %{"query" => "Distinctive MCP"})

    assert {:error, :invalid_arguments} =
             Search.call(conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "project_id" => Paths.project_id(ctx.project),
               "query" => "Distinctive MCP"
             })
  end

  defp conn(ctx), do: ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

  defp rename_file(ctx, name, description) do
    file =
      ctx.file
      |> File.changeset(%{name: name, description: description})
      |> Repo.update!()

    Map.put(ctx, :file, file)
  end

  defp rename_link(ctx, name, description) do
    link =
      ctx.link
      |> Link.changeset(%{name: name, description: description})
      |> Repo.update!()

    Map.put(ctx, :link, link)
  end
end
