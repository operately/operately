defmodule OperatelyWeb.Api.Mutations.CreateBlobTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_blob, %{})
    end
  end

  describe "create_blob functionality" do
    setup :register_and_log_in_account

    test "it creates a new blob record in the database", ctx do
      assert {200, blob} = mutation(ctx.conn, :create_blob, %{
        filename: "test.txt",
        size: 1024,
        content_type: "text/plain"
      })

      assert blob.id != nil
      assert blob.url == "/blobs/#{blob.id}"
      assert blob.signed_upload_url != nil

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.storage_type != nil
    end
  end
end 
