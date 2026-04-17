defmodule OperatelyWeb.Api.CompanyTransfers.CreateImportArtifactBlobsTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:company_transfers, :create_import_artifact_blobs], %{})
    end
  end

  describe "create_import_artifact_blobs functionality" do
    setup ctx do
      ctx
      |> Factory.add_account(:account)
      |> Factory.log_in_account(:account)
    end

    test "it creates import artifact blobs for an account without a company", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:company_transfers, :create_import_artifact_blobs], %{
                 files: [
                   %{
                     filename: "import.json",
                     size: 1024,
                     content_type: "application/json"
                   }
                 ]
               })

      blob = hd(res.blobs)
      assert blob.id != nil
      assert blob.url == "/blobs/#{blob.id}"
      assert blob.signed_upload_url != nil

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.purpose == :company_transfer_import_artifact
      assert blob.account_id == ctx.account.id
      assert blob.company_id == nil
      assert blob.author_id == nil
    end
  end
end
