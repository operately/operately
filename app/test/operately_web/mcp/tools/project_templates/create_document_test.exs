defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateDocumentTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ResourceDocument
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateDocument
  alias OperatelyWeb.Paths

  test "call/2 creates a document in a template folder" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_resource_folder(:folder, :template, position: 0)

    assert {:ok, %{document: document}} =
             CreateDocument.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "parent_folder_id" => Paths.project_template_resource_folder_id(ctx.folder),
               "name" => "New document",
               "content" => "# Document"
             })

    db_document =
      document.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(ResourceDocument, &1))
      |> Operately.Repo.preload(:node)

    assert db_document.name == "New document"
    assert db_document.node.parent_folder_id == ctx.folder.id
  end
end
