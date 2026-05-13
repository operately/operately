defmodule OperatelyWeb.Api.CompanyTransfers.StartImportTest do
  use OperatelyWeb.TurboCase
  use Oban.Testing, repo: Operately.Repo

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:company_transfers, :start_import], %{})
    end
  end

  describe "start_import functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:member)
    end

    test "any authenticated user can start an import", ctx do
      {:ok, package_blob} = create_package_blob(ctx.member.account_id)

      {:ok, res} =
        Oban.Testing.with_testing_mode(:manual, fn ->
          {200, res} =
            mutation(ctx.conn, [:company_transfers, :start_import], %{
              package_blob_id: package_blob.id
            })

          {:ok, res}
        end)

      assert res.import_run.status == "pending"
      assert res.import_run.id

      run = Operately.CompanyTransfers.get_import_run(res.import_run.id)
      assert run.requested_by_id == ctx.member.account_id
      assert run.status == :pending
      assert run.package_blob_id == package_blob.id
    end

    test "enqueues an import worker", ctx do
      {:ok, package_blob} = create_package_blob(ctx.member.account_id)

      {:ok, res} =
        Oban.Testing.with_testing_mode(:manual, fn ->
          {200, res} =
            mutation(ctx.conn, [:company_transfers, :start_import], %{
              package_blob_id: package_blob.id
            })

          {:ok, res}
        end)

      jobs = all_enqueued(worker: Operately.CompanyTransfers.ImportWorker)
      assert length(jobs) == 1
      assert hd(jobs).args["import_run_id"] == res.import_run.id
    end

    test "requires package_blob_id parameter", ctx do
      assert {400, _res} = mutation(ctx.conn, [:company_transfers, :start_import], %{})
    end

    test "requires the package blob to be marked as uploaded", ctx do
      {:ok, package_blob} = create_package_blob(ctx.member.account_id, status: :pending)

      assert {400, res} =
               mutation(ctx.conn, [:company_transfers, :start_import], %{
                 package_blob_id: package_blob.id
               })

      assert res.message == "Import package must finish uploading before the import can start"
    end

    test "rejects regular company blobs for import staging", ctx do
      {:ok, package_blob} =
        Operately.Blobs.create_blob(%{
          purpose: :company_file,
          company_id: ctx.company.id,
          author_id: ctx.member.id,
          status: :uploaded,
          filename: "operately.zip",
          size: 2048,
          content_type: "application/zip"
        })

      assert {400, res} =
               mutation(ctx.conn, [:company_transfers, :start_import], %{
                 package_blob_id: package_blob.id
               })

      assert res.message == "Import packages must be staged through the company import flow"
    end

    test "allows an account without companies to start an import", ctx do
      ctx =
        ctx
        |> Factory.add_account(:loose_account)
        |> Factory.log_in_account(:loose_account)

      {:ok, package_blob} = create_package_blob(ctx.loose_account.id)

      {:ok, res} =
        Oban.Testing.with_testing_mode(:manual, fn ->
          {200, res} =
            mutation(ctx.conn, [:company_transfers, :start_import], %{
              package_blob_id: package_blob.id
            })

          {:ok, res}
        end)

      run = Operately.CompanyTransfers.get_import_run(res.import_run.id)
      assert run.requested_by_id == ctx.loose_account.id
      assert run.package_blob_id == package_blob.id
    end
  end

  defp create_package_blob(account_id, opts \\ []) do
    Operately.Blobs.create_blob(%{
      purpose: :company_transfer_import_artifact,
      account_id: account_id,
      status: Keyword.get(opts, :status, :uploaded),
      filename: "operately.zip",
      size: 2048,
      content_type: "application/zip"
    })
  end
end
