defmodule Operately.ProjectTemplates.ResourceNodeTest do
  use Operately.DataCase

  alias Operately.ProjectTemplates.{ResourceDocument, ResourceFile, ResourceFolder, ResourceLink, ResourceNode}

  setup do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_project_template(:template, :space)
    {:ok, ctx}
  end

  test "validates the required resource node and content fields", ctx do
    assert errors_on(ResourceNode.changeset(%{})) == %{
             project_template_id: ["can't be blank"],
             position: ["can't be blank"],
             type: ["can't be blank"]
           }

    assert errors_on(ResourceFolder.changeset(%{})) == %{name: ["can't be blank"], node_id: ["can't be blank"]}
    assert errors_on(ResourceDocument.changeset(%{})) == %{content: ["can't be blank"], name: ["can't be blank"], node_id: ["can't be blank"]}
    assert errors_on(ResourceFile.changeset(%{})) == %{blob_id: ["can't be blank"], name: ["can't be blank"], node_id: ["can't be blank"]}
    assert errors_on(ResourceLink.changeset(%{})) == %{name: ["can't be blank"], node_id: ["can't be blank"], type: ["can't be blank"], url: ["can't be blank"]}

    assert ResourceNode.changeset(%{project_template_id: ctx.template.id, type: :folder, position: 0}).valid?
    assert errors_on(ResourceNode.changeset(%{project_template_id: ctx.template.id, type: :folder, position: -1})) == %{position: ["must be greater than or equal to 0"]}
  end

  test "hard-deleting a folder node removes its entire template subtree", ctx do
    ctx =
      ctx
      |> Factory.add_project_template_resource_folder(:folder, :template)
      |> Factory.add_project_template_resource_document(:document, :template, parent_folder: :folder)

    Repo.delete!(ctx.folder.node)

    assert Repo.get(ResourceFolder, ctx.folder.id) == nil
    assert Repo.get(ResourceNode, ctx.document.node.id) == nil
    assert Repo.get(ResourceDocument, ctx.document.id) == nil
  end

  test "hard-deleting an author preserves resources and clears attribution", ctx do
    ctx = Factory.add_project_template_resource_document(ctx, :document, :template)

    Repo.delete!(ctx.creator)

    assert Repo.get!(ResourceDocument, ctx.document.id).author_id == nil
  end
end
