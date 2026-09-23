defmodule Operately.ResourceHubs.PublicDocumentTest do
  use Operately.DataCase

  alias Operately.Support.Factory
  alias Operately.ResourceHubs.PublicDocument

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, state: :published)
  end

  test "private documents and unknown tokens are unavailable", ctx do
    assert ctx.document.public_token == nil
    assert {:error, :not_found} = PublicDocument.get("unknown")
    assert {:error, :not_found} = PublicDocument.get(nil)
  end

  test "reads current content and rejects deleted documents and parents", ctx do
    document = ctx.document |> Ecto.Changeset.change(public_token: "shared") |> Repo.update!()
    assert {:ok, public} = PublicDocument.get("shared")
    assert public.name == document.name

    document |> Ecto.Changeset.change(name: "Updated") |> Repo.update!()
    assert {:ok, %{name: "Updated"}} = PublicDocument.get("shared")

    Repo.soft_delete!(ctx.space)
    assert {:error, :not_found} = PublicDocument.get("shared")
  end

  test "drafts and deleted documents are never public", ctx do
    document = ctx.document |> Ecto.Changeset.change(public_token: "shared", state: :draft) |> Repo.update!()
    assert {:error, :not_found} = PublicDocument.get("shared")
    document = document |> Ecto.Changeset.change(state: :published) |> Repo.update!()
    Repo.soft_delete!(document)
    assert {:error, :not_found} = PublicDocument.get("shared")
  end

  test "project and goal documents become unavailable when their parent is deleted", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_resource_hub(:project_hub, :project, :creator)
      |> Factory.add_resource_hub(:goal_hub, :goal, :creator)
      |> Factory.add_document(:project_document, :project_hub)
      |> Factory.add_document(:goal_document, :goal_hub)

    for {document, parent} <- [{ctx.project_document, ctx.project}, {ctx.goal_document, ctx.goal}] do
      document |> Ecto.Changeset.change(public_token: document.id) |> Repo.update!()
      assert {:ok, _} = PublicDocument.get(document.id)
      Repo.soft_delete!(parent)
      assert {:error, :not_found} = PublicDocument.get(document.id)
    end
  end

  test "public content removes mention identifiers and scopes nested attachments" do
    blob_id = Ecto.UUID.generate()
    content = %{"type" => "doc", "content" => [
      %{"type" => "blockquote", "content" => [
        %{"type" => "paragraph", "content" => [
          %{"type" => "mention", "attrs" => %{"id" => "private-person", "label" => "Sam"}},
          %{"type" => "blob", "attrs" => %{"id" => blob_id, "src" => "/blobs/#{blob_id}", "title" => "Diagram"}}
        ]}
      ]}
    ]}

    result = PublicDocument.public_content(content, "token")
    encoded = Jason.encode!(result)
    refute encoded =~ "private-person"
    assert encoded =~ "Sam"
    assert encoded =~ "/public/documents/token/blobs/#{blob_id}"
    assert PublicDocument.blob_ids(content) == [blob_id]
  end
end
