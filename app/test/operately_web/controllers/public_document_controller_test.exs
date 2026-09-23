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

  test "delivers the complete attachment over HTTP before cleaning up its temporary file", ctx do
    blob = ctx.blob |> Ecto.Changeset.change(status: :uploaded, content_type: "image/png") |> Repo.update!()
    content = %{"type" => "doc", "content" => [%{"type" => "blob", "attrs" => %{"id" => blob.id}}]}
    ctx.document |> Ecto.Changeset.change(public_token: "shared", content: content) |> Repo.update!()
    image_bytes = :binary.copy(<<137, 80, 78, 71, 0, 255>>, 50_000)
    test_pid = self()

    with_mock Operately.Blobs.Download, [:passthrough], download: fn _, path ->
      send(test_pid, {:download_path, path})
      File.write(path, image_bytes)
    end do
      # ConnTest reads send_file eagerly; real Cowboy responses defer reading the file.
      assert {:ok, response} = Req.get(OperatelyWeb.Endpoint.url() <> "/public/documents/shared/blobs/#{blob.id}", retry: false, decode_body: false)
      assert response.status == 200
      assert response.body == image_bytes
      assert response.headers["content-type"] == ["image/png"]
      assert response.headers["cache-control"] == ["no-store"]
      assert response.headers["content-disposition"] == ["inline; filename=\"some%20filename\"; filename*=utf-8''some%20filename"]
      assert_receive {:download_path, path}
      refute File.exists?(path)
    end
  end

  test "keeps forced downloads and unsafe content types as attachments", ctx do
    blob = ctx.blob |> Ecto.Changeset.change(status: :uploaded, content_type: "image/png", filename: "image.png") |> Repo.update!()
    content = %{"type" => "doc", "content" => [%{"type" => "blob", "attrs" => %{"id" => blob.id}}]}
    ctx.document |> Ecto.Changeset.change(public_token: "shared", content: content) |> Repo.update!()

    with_mock Operately.Blobs.Download, [:passthrough], download: fn _, path -> File.write(path, "attachment bytes") end do
      conn = get(ctx.conn, "/public/documents/shared/blobs/#{blob.id}?disposition=attachment")
      assert conn.resp_body == "attachment bytes"
      assert get_resp_header(conn, "content-disposition") == ["attachment; filename=\"image.png\""]

      blob |> Ecto.Changeset.change(content_type: "text/html", filename: "page.html") |> Repo.update!()
      conn = get(build_conn(), "/public/documents/shared/blobs/#{blob.id}")
      assert conn.resp_body == "attachment bytes"
      assert get_resp_header(conn, "content-disposition") == ["attachment; filename=\"page.html\""]
      assert get_resp_header(conn, "x-content-type-options") == ["nosniff"]
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
