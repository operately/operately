defmodule OperatelyWeb.Api.Documents.GetPublicTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, state: :published)
  end

  test "anonymous readers only receive public document fields", ctx do
    ctx.document |> Ecto.Changeset.change(public_token: "shared") |> Repo.update!()

    assert {200, %{document: document}} = query(ctx.conn, [:documents, :get_public], %{token: "shared"})
    assert document.name == ctx.document.name
    assert Enum.sort(Map.keys(document)) == Enum.sort([:__typename, :name, :content, :published_at, :updated_at])
  end

  test "revoked links cannot read the document", ctx do
    document = ctx.document |> Ecto.Changeset.change(public_token: "shared") |> Repo.update!()
    document |> Ecto.Changeset.change(public_token: nil) |> Repo.update!()
    assert {404, _} = query(ctx.conn, [:documents, :get_public], %{token: "shared"})
  end
end
