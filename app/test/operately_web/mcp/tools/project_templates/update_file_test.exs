defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateFileTest do
  use Operately.DataCase, async: true

  alias Operately.Blobs.Blob
  alias Operately.ProjectTemplates.ResourceFile
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateFile
  alias OperatelyWeb.Paths

  test "call/2 updates a template file and clears description" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_blob(:blob)
      |> then(fn ctx -> %{ctx | blob: ctx.blob |> Blob.changeset(%{status: :uploaded}) |> Operately.Repo.update!()} end)
      |> Factory.add_project_template_resource_file(:file, :template, :blob, name: "Original", description: %{"type" => "doc", "content" => []})

    assert {:ok, %{file: file}} =
             UpdateFile.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "file_id" => Paths.project_template_resource_file_id(ctx.file),
               "name" => "Updated file",
               "description" => nil
             })

    db_file = Operately.Repo.get!(ResourceFile, ctx.file.id)

    assert file.name == "Updated file"
    assert db_file.name == "Updated file"
    assert db_file.description == nil
  end
end
