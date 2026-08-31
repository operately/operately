defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.ListTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.List
  alias OperatelyWeb.Paths

  test "call/2 browses resource hub contents" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_folder(:nested_folder, :hub, :folder)
      |> Factory.add_document(:document, :hub, folder: :folder)
      |> Factory.add_file(:file, :hub, folder: :folder)
      |> Factory.add_link(:link, :hub, folder: :folder)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{nodes: nodes, draft_nodes: []}} = List.call(conn, %{"folder_id" => Paths.folder_id(ctx.folder)})

    node_ids =
      nodes
      |> Enum.map(& &1.id)
      |> Enum.sort()

    assert node_ids ==
             Enum.sort([
               Paths.node_id(%{id: ctx.nested_folder.node_id}),
               Paths.node_id(%{id: ctx.document.node_id}),
               Paths.node_id(%{id: ctx.file.node_id}),
               Paths.node_id(%{id: ctx.link.node_id})
             ])

    folder_node = Enum.find(nodes, & &1.folder)
    document_node = Enum.find(nodes, & &1.document)
    file_node = Enum.find(nodes, & &1.file)
    link_node = Enum.find(nodes, & &1.link)

    assert folder_node.folder.url == Paths.to_url(Paths.folder_path(ctx.company, ctx.nested_folder))
    refute String.contains?(URI.parse(folder_node.folder.url).path, "/files/folders/")
    assert document_node.document.url == Paths.to_url(Paths.document_path(ctx.company, ctx.document))
    assert file_node.file.url == Paths.to_url(Paths.file_path(ctx.company, ctx.file))
    assert link_node.link.url == ctx.link.url
    assert link_node.link.page_url == Paths.to_url(Paths.link_path(ctx.company, ctx.link))
  end

  test "call/2 rejects none or multiple scopes" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:error, :invalid_arguments} = List.call(conn, %{})

    assert {:error, :invalid_arguments} =
             List.call(conn, %{
               "space_id" => Paths.space_id(ctx.space),
               "project_id" => Paths.project_id(ctx.project)
             })
  end
end
