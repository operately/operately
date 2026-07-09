defmodule OperatelyEE.AdminApi.Queries.GetCompaniesTest do
  use Operately.DataCase

  import Operately.BlobsFixtures

  alias OperatelyEE.AdminApi.Queries.GetCompanies
  alias Operately.Support.Factory

  describe "GetCompanies.call/2" do
    test "returns empty list when no companies exist" do
      assert {:ok, %{companies: []}} = GetCompanies.call(nil, %{})
    end

    test "serializes storage_usage_bytes as sum of uploaded company blobs", ctx do
      ctx = Factory.setup(ctx)

      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :uploaded, size: 1024})
      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :uploaded, size: 2048})
      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :pending, size: 4096})

      {:ok, result} = GetCompanies.call(nil, %{})

      company_data = Enum.find(result.companies, &(&1.name == ctx.company.name))
      assert company_data.storage_usage_bytes == 3072
    end

    test "returns zero storage when company has no uploaded blobs", ctx do
      ctx = Factory.setup(ctx)

      {:ok, result} = GetCompanies.call(nil, %{})

      company_data = Enum.find(result.companies, &(&1.name == ctx.company.name))
      assert company_data.storage_usage_bytes == 0
    end
  end
end
