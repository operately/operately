defmodule OperatelyWeb.Api.Mutations.CreateBlobTest do
  use OperatelyWeb.TurboCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.BlobsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_blob, %{})
    end
  end

  describe "create_blob functionality" do
    setup :register_and_log_in_account

    test "it creates a new blob record in the database", ctx do
      assert {200, res} =
               mutation(ctx.conn, :create_blob, %{
                 files: [
                   %{filename: "test.txt", size: 1024, content_type: "text/plain"}
                 ]
               })

      blob = hd(res.blobs)

      assert blob.id != nil
      assert blob.url == "/blobs/#{blob.id}"
      assert blob.signed_upload_url != nil

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.storage_type != nil
      assert blob.purpose == :company_file
      assert blob.account_id == nil
    end

    test "it does not enqueue a limit email for pending blobs", ctx do
      enable_billing(ctx.company)

      Oban.Testing.with_testing_mode(:manual, fn ->
        assert {200, _res} =
                 mutation(ctx.conn, :create_blob, %{
                   files: [
                     %{filename: "test.txt", size: 1024, content_type: "text/plain"}
                   ]
                 })

        refute_enqueued worker: Operately.Billing.LimitBreachAlertEmailWorker
      end)
    end

    test "it creates multiple blob records in the database", ctx do
      assert {200, res} =
               mutation(ctx.conn, :create_blob, %{
                 files: [
                   %{filename: "test.txt", size: 1024, content_type: "text/plain"},
                   %{filename: "test.txt", size: 1024, content_type: "image/jpeg", width: 1920, height: 1080},
                   %{filename: "test.txt", size: 1024, content_type: "image/jpeg"}
                 ]
               })

      assert length(res.blobs) == 3

      Enum.each(res.blobs, fn blob ->
        assert blob.id != nil
        assert blob.url == "/blobs/#{blob.id}"
        assert blob.signed_upload_url != nil

        blob = Operately.Blobs.get_blob!(blob.id)
        assert blob.storage_type != nil
        assert blob.purpose == :company_file
        assert blob.account_id == nil
      end)
    end

    test "it blocks uploads that would exceed the storage limit", ctx do
      enable_billing(ctx.company)
      blob_fixture(%{
        company_id: ctx.company.id,
        author_id: ctx.person.id,
        status: :uploaded,
        size: Operately.Billing.Plans.storage_limit_bytes(:free)
      })

      initial_blob_count = Repo.aggregate(Operately.Blobs.Blob, :count, :id)

      assert {400, res} =
               mutation(ctx.conn, :create_blob, %{
                 files: [
                   %{filename: "test.txt", size: 1, content_type: "text/plain"}
                 ]
               })

      assert res.message == "This company has reached its storage limit. Upgrade the plan to add more files."
      assert res.details.code == "storage_limit_exceeded"
      assert res.details.limit_key == "storage_bytes"
      assert res.details.current_usage == Operately.Billing.Plans.storage_limit_bytes(:free)
      assert Repo.aggregate(Operately.Blobs.Blob, :count, :id) == initial_blob_count
    end

    test "it does not block uploads when billing is disabled for the company", ctx do
      blob_fixture(%{
        company_id: ctx.company.id,
        author_id: ctx.person.id,
        status: :uploaded,
        size: Operately.Billing.Plans.storage_limit_bytes(:free)
      })

      assert {200, res} =
               mutation(ctx.conn, :create_blob, %{
                 files: [
                   %{filename: "test.txt", size: 1, content_type: "text/plain"}
                 ]
               })

      assert length(res.blobs) == 1
    end

    test "it rejects files with invalid sizes instead of treating them as zero", ctx do
      initial_blob_count = Repo.aggregate(Operately.Blobs.Blob, :count, :id)

      assert {400, res} =
               mutation(ctx.conn, :create_blob, %{
                 files: [
                   %{filename: "test.txt", size: nil, content_type: "text/plain"}
                 ]
               })

      assert res.message == "File size must be a non-negative integer"
      assert Repo.aggregate(Operately.Blobs.Blob, :count, :id) == initial_blob_count
    end
  end

  defp enable_billing(company) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

    {:ok, _company} = Operately.Companies.enable_experimental_feature(company, "billing")
  end
end
