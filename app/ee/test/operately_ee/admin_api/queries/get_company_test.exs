defmodule OperatelyEE.AdminApi.Queries.GetCompanyTest do
  use OperatelyWeb.TurboCase

  alias Operately.Companies.ExperimentalFeatures
  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_query(ctx.conn, :get_company, %{id: Operately.Companies.ShortId.encode!(999_999_999)})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)

      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company)})
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

    test "returns the company and available feature flags", ctx do
      {:ok, _} = Operately.Companies.enable_experimental_feature(ctx.company, "legacy_flag")

      assert {200, result} = admin_query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company)})

      assert result.company.name == ctx.company.name
      assert result.company.enabled_features == ["legacy_flag"]
      assert result.available_features == ExperimentalFeatures.available()
      assert "project_templates" in result.available_features
    end

    test "returns not found for an unknown company", ctx do
      assert {404, _} = admin_query(ctx.conn, :get_company, %{id: Operately.Companies.ShortId.encode!(999_999_999)})
    end
  end
end
