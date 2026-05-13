defmodule OperatelyWeb.Api.CompanyTransfers.GetExportRunTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:company_transfers, :get_export_run], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.add_company_member(:owner)
    end

    test "company member cannot get export run", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)
      owner = Operately.Repo.preload(ctx.owner, :account)
      {:ok, run} = Operately.CompanyTransfers.create_export_run(ctx.company, owner.account, %{}, dispatch: false)

      ctx = Factory.log_in_person(ctx, :member)

      assert {403, res} = query(ctx.conn, [:company_transfers, :get_export_run], %{
        id: run.id
      })

      assert res.message == "You don't have permission to perform this action"
    end

    test "company owner can get export run", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)
      owner = Operately.Repo.preload(ctx.owner, :account)
      {:ok, run} = Operately.CompanyTransfers.create_export_run(ctx.company, owner.account, %{}, dispatch: false)

      ctx = Factory.log_in_person(ctx, :owner)

      assert {200, res} = query(ctx.conn, [:company_transfers, :get_export_run], %{
        id: run.id
      })

      assert res.export_run.id == run.id
      assert res.export_run.status == "pending"
    end
  end

  describe "get_export_run functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:owner)
      |> Factory.log_in_person(:owner)
    end

    test "returns export run details", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)
      owner = Operately.Repo.preload(ctx.owner, :account)
      {:ok, run} = Operately.CompanyTransfers.create_export_run(ctx.company, owner.account, %{}, dispatch: false)

      assert {200, res} = query(ctx.conn, [:company_transfers, :get_export_run], %{
        id: run.id
      })

      assert res.export_run.id == run.id
      assert res.export_run.status == "pending"
      assert res.export_run.inserted_at
    end

    test "returns package download fields for completed exports", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)
      owner = Operately.Repo.preload(ctx.owner, :account)
      {:ok, run} = Operately.CompanyTransfers.create_export_run(ctx.company, owner.account, %{}, dispatch: false)

      {:ok, package_blob} =
        Operately.Blobs.create_blob(%{
          company_id: ctx.company.id,
          author_id: ctx.owner.id,
          status: :uploaded,
          filename: "operately.zip",
          size: 2048,
          content_type: "application/zip"
        })

      {:ok, run} =
        Operately.CompanyTransfers.update_export_run(run, %{
          status: :completed,
          package_blob_id: package_blob.id,
          package_size_bytes: 2048
        })

      assert {200, res} = query(ctx.conn, [:company_transfers, :get_export_run], %{id: run.id})

      assert res.export_run.package_blob_id == package_blob.id
      assert res.export_run.package_download_url
      assert res.export_run.package_size_bytes == 2048
    end

    test "returns 404 for non-existent export run", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)

      assert {404, res} = query(ctx.conn, [:company_transfers, :get_export_run], %{
        id: Ecto.UUID.generate()
      })

      assert res.message == "The requested resource was not found"
    end

    test "returns 403 for export run from another company", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)

      other_ctx = Factory.setup(%{})
      Operately.Companies.add_owner(other_ctx.creator, other_ctx.creator.id)
      creator = Operately.Repo.preload(other_ctx.creator, :account)
      {:ok, run} = Operately.CompanyTransfers.create_export_run(other_ctx.company, creator.account, %{}, dispatch: false)

      assert {403, res} = query(ctx.conn, [:company_transfers, :get_export_run], %{
        id: run.id
      })

      assert res.message == "You don't have permission to perform this action"
    end
  end
end
