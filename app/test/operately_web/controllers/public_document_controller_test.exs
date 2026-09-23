defmodule OperatelyWeb.PublicDocumentControllerTest do
  use OperatelyWeb.ConnCase
  import Mock

  alias Operately.Repo
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, state: :published)
    |> Factory.add_blob(:blob)
  end

  test "the public page loads without login and forbids caching and indexing", ctx do
    conn = get(ctx.conn, "/public/documents/token")
    assert conn.status == 200
    assert get_resp_header(conn, "cache-control") == ["no-store"]
    assert get_resp_header(conn, "x-robots-tag") == ["noindex, nofollow, noarchive"]
    assert get_resp_header(conn, "referrer-policy") == ["no-referrer"]
  end

  test "public API responses cannot be cached", ctx do
    ctx.document |> Ecto.Changeset.change(public_token: "shared") |> Repo.update!()
    conn = get(ctx.conn, "/api/v2/documents/get_public", %{token: "shared"})
    assert conn.status == 200
    assert get_resp_header(conn, "cache-control") == ["no-store"]
  end

  test "public links cannot download unrelated attachments", ctx do
    ctx.document |> Ecto.Changeset.change(public_token: "shared") |> Repo.update!()
    conn = get(ctx.conn, "/public/documents/shared/blobs/#{ctx.blob.id}")
    assert conn.status == 404
    assert get_resp_header(conn, "location") == []
  end

  test "revoked links cannot download even an embedded attachment", ctx do
    content = %{"type" => "doc", "content" => [%{"type" => "blob", "attrs" => %{"id" => ctx.blob.id}}]}
    document = ctx.document |> Ecto.Changeset.change(public_token: "shared", content: content) |> Repo.update!()
    document |> Ecto.Changeset.change(public_token: nil) |> Repo.update!()
    assert get(ctx.conn, "/public/documents/shared/blobs/#{ctx.blob.id}").status == 404
  end

  test "serves embedded attachment bytes without exposing a storage URL", ctx do
    blob = ctx.blob |> Ecto.Changeset.change(status: :uploaded, content_type: "image/png") |> Repo.update!()
    content = %{"type" => "doc", "content" => [%{"type" => "blob", "attrs" => %{"id" => blob.id}}]}
    document = ctx.document |> Ecto.Changeset.change(public_token: "shared", content: content) |> Repo.update!()

    with_mock Operately.Blobs.Download, [:passthrough], download: fn _, path -> File.write(path, "image bytes") end do
      conn = get(ctx.conn, "/public/documents/shared/blobs/#{blob.id}")
      assert conn.status == 200
      assert conn.resp_body == "image bytes"
      assert get_resp_header(conn, "location") == []
      assert get_resp_header(conn, "cache-control") == ["no-store"]

      document |> Ecto.Changeset.change(content: %{"type" => "doc", "content" => []}) |> Repo.update!()
      assert get(build_conn(), "/public/documents/shared/blobs/#{blob.id}").status == 404
    end
  end

  test "rejects attachments from another company even when their id is embedded", ctx do
    other = %{} |> Factory.setup() |> Factory.add_blob(:blob)
    other.blob |> Ecto.Changeset.change(status: :uploaded) |> Repo.update!()
    content = %{"type" => "doc", "content" => [%{"type" => "blob", "attrs" => %{"id" => other.blob.id}}]}
    ctx.document |> Ecto.Changeset.change(public_token: "shared", content: content) |> Repo.update!()
    assert get(ctx.conn, "/public/documents/shared/blobs/#{other.blob.id}").status == 404
  end
end
