defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateDocumentTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Document
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateDocument
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a document in a space hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:ok, %{document: document}} =
             CreateDocument.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Document",
               "content" => "# Document"
             })

    document =
      document.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Document, &1))
      |> Operately.Repo.preload(:node)

    assert document.node.name == "MCP Document"
    assert ToolConnHelper.rich_text_to_string(document.content) == "Document"
  end

  test "call/2 creates a document in a project hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:hub, :project)

    assert {:ok, %{document: document}} =
             CreateDocument.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "name" => "Project MCP Document",
               "content" => "Project body"
             })

    document =
      document.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Document, &1))
      |> Operately.Repo.preload(:node)

    assert document.node.name == "Project MCP Document"
    assert ToolConnHelper.rich_text_to_string(document.content) == "Project body"
  end

  test "returns invalid_arguments when hub scope is missing" do
    ctx =
      %{}
      |> Factory.setup()

    assert {:error, :invalid_arguments} =
             CreateDocument.call(ToolConnHelper.conn(ctx), %{
               "name" => "MCP Document",
               "content" => "Body"
             })
  end

  test "returns invalid_arguments for conflicting hub scopes" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:error, :invalid_arguments} =
             CreateDocument.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "project_id" => Paths.project_id(ctx.project),
               "name" => "Invalid",
               "content" => "Body"
             })
  end
end
