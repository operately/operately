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

  test "public responses resolve titles for authorized readers and keep source labels for anonymous readers", ctx do
    source = Operately.Support.RichText.resource_link(Paths.space_path(ctx.company, ctx.space))
    ctx.document |> Ecto.Changeset.change(public_token: "shared", content: source) |> Repo.update!()

    assert {200, %{document: anonymous}} = query(ctx.conn, [:documents, :get_public], %{token: "shared"})

    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, %{document: authenticated}} = query(ctx.conn, [:documents, :get_public], %{token: "shared"})
    assert Jason.decode!(anonymous.content) == source

    enriched = Jason.decode!(authenticated.content)

    assert get_in(enriched, ["content", Access.at(0), "content", Access.at(0), "text"]) == ctx.space.name
    assert Operately.RichContent.LinkEnrichment.restore_source(enriched) == source
  end

  test "public responses keep source labels for authenticated readers without access to linked resources", ctx do
    ctx =
      ctx
      |> Factory.add_project(:secret, :space, company_access_level: Operately.Access.Binding.no_access())
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:member)

    source = Operately.Support.RichText.resource_link(Paths.project_path(ctx.company, ctx.secret))
    ctx.document |> Ecto.Changeset.change(public_token: "shared", content: source) |> Repo.update!()

    assert {200, %{document: document}} = query(ctx.conn, [:documents, :get_public], %{token: "shared"})
    assert Jason.decode!(document.content) == source
  end

  test "revoked links cannot read the document", ctx do
    document = ctx.document |> Ecto.Changeset.change(public_token: "shared") |> Repo.update!()
    document |> Ecto.Changeset.change(public_token: nil) |> Repo.update!()
    assert {404, _} = query(ctx.conn, [:documents, :get_public], %{token: "shared"})
  end
end
