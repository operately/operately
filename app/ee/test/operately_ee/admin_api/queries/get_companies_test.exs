defmodule OperatelyEE.AdminApi.Queries.GetCompaniesTest do
  use OperatelyWeb.TurboCase

  import Operately.BlobsFixtures

  alias Operately.People.Account
  alias Operately.Support.Factory

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_companies, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)

      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_companies, %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "returns companies from the database", ctx do
      assert {200, %{companies: companies}} = admin_query(ctx.conn, :get_companies, %{})

      assert Enum.any?(companies, &(&1.name == ctx.company.name))
    end

    test "serializes storage_usage_bytes as sum of uploaded company blobs", ctx do
      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :uploaded, size: 1024})
      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :uploaded, size: 2048})
      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :pending, size: 4096})

      assert {200, %{companies: companies}} = admin_query(ctx.conn, :get_companies, %{})

      company_data = Enum.find(companies, &(&1.name == ctx.company.name))
      assert company_data.storage_usage_bytes == 3072
    end

    test "returns zero storage when company has no uploaded blobs", ctx do
      assert {200, %{companies: companies}} = admin_query(ctx.conn, :get_companies, %{})

      company_data = Enum.find(companies, &(&1.name == ctx.company.name))
      assert company_data.storage_usage_bytes == 0
    end
  end
end
