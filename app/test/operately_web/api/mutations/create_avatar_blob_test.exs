defmodule OperatelyWeb.Api.Mutations.CreateAvatarBlobTest do
  use OperatelyWeb.TurboCase

  @max_size 12 * 1024 * 1024

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_avatar_blob, %{})
    end
  end

  describe "create_avatar_blob functionality" do
    setup :register_and_log_in_account

    test "creates a blob record when size is within limit", ctx do
      assert {200, res} =
               mutation(ctx.conn, :create_avatar_blob, %{
                 files: [
                   %{
                     filename: "avatar.png",
                     size: @max_size - 1,
                     content_type: "image/png"
                   }
                 ]
               })

      assert length(res.blobs) == 1

      blob_id = hd(res.blobs).id
      assert blob_id
      assert Operately.Blobs.get_blob!(blob_id)
    end

    test "returns an error when size exceeds limit", ctx do
      assert {400, resp} =
               mutation(ctx.conn, :create_avatar_blob, %{
                 files: [
                   %{
                     filename: "huge-avatar.png",
                     size: @max_size + 1,
                     content_type: "image/png"
                   }
                 ]
               })

      assert resp.message == "Avatar file is too large"
    end
  end
end
