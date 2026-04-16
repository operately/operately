defmodule OperatelyWeb.Api.Mutations.MarkBlobUploadedTest do
  use OperatelyWeb.TurboCase

  import Operately.BlobsFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :mark_blob_uploaded, %{})
    end
  end

  describe "mark_blob_uploaded functionality" do
    setup :register_and_log_in_account

    test "marks a pending blob as uploaded", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id})

      assert {200, res} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: blob.id})

      assert res.blob.id == Paths.blob_id(blob)
      assert res.blob.status == "uploaded"

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.status == :uploaded
    end

    test "is idempotent for already uploaded blobs", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id, status: :uploaded})

      assert {200, res} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: blob.id})
      assert res.blob.status == "uploaded"

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.status == :uploaded
    end

    test "does not allow marking another person's blob", ctx do
      other_person = person_fixture(%{company_id: ctx.company.id})
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: other_person.id})

      assert {403, %{}} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: blob.id})

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.status == :pending
    end

    test "returns 404 for a missing blob", ctx do
      assert {404, res} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: Ecto.UUID.generate()})
      assert res.message == "The requested resource was not found"
    end
  end
end
