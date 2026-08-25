defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateDocumentTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ResourceDocument
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateDocument
  alias OperatelyWeb.Paths

  test "call/2 updates a template document" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_resource_document(:document, :template, name: "Original", content: %{"type" => "doc", "content" => []})

    assert {:ok, %{document: document}} =
             UpdateDocument.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "document_id" => Paths.project_template_resource_document_id(ctx.document),
               "name" => "Updated document",
               "content" => "# Updated"
             })

    db_document = Operately.Repo.get!(ResourceDocument, ctx.document.id)

    assert document.name == "Updated document"
    assert db_document.name == "Updated document"
    assert ToolConnHelper.rich_text_to_string(db_document.content) == "Updated"
  end
end
