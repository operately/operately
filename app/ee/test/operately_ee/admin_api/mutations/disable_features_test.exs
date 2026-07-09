defmodule OperatelyEE.AdminApi.Mutations.DisableFeaturesTest do
  use OperatelyWeb.TurboCase

  alias Operately.Companies
  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :disable_features, %{
                 company_id: Operately.Companies.ShortId.encode!(999_999_999),
                 features: ["some_feature"]
               })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :disable_features, %{
                 company_id: Paths.company_id(ctx.company),
                 features: ["some_feature"]
               })
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

    test "removes a single feature from a company with multiple flags", ctx do
      {:ok, company} = Companies.enable_experimental_feature(ctx.company, "feature_a")
      {:ok, company} = Companies.enable_experimental_feature(company, "feature_b")
      {:ok, company} = Companies.enable_experimental_feature(company, "feature_c")

      assert {200, %{success: true}} =
               admin_mutation(ctx.conn, :disable_features, %{
                 company_id: Paths.company_id(company),
                 features: ["feature_b"]
               })

      company = Repo.reload(company)
      assert Enum.sort(company.enabled_experimental_features) == ["feature_a", "feature_c"]
    end

    test "removes multiple features in one call", ctx do
      {:ok, company} = Companies.enable_experimental_feature(ctx.company, "feature_a")
      {:ok, company} = Companies.enable_experimental_feature(company, "feature_b")
      {:ok, company} = Companies.enable_experimental_feature(company, "feature_c")

      assert {200, %{success: true}} =
               admin_mutation(ctx.conn, :disable_features, %{
                 company_id: Paths.company_id(company),
                 features: ["feature_a", "feature_c"]
               })

      company = Repo.reload(company)
      assert company.enabled_experimental_features == ["feature_b"]
    end

    test "returns not found for an unknown company", ctx do
      assert {404, _} =
               admin_mutation(ctx.conn, :disable_features, %{
                 company_id: Operately.Companies.ShortId.encode!(999_999_999),
                 features: ["some_feature"]
               })
    end

    test "returns bad request for an empty features list", ctx do
      assert {400, _} =
               admin_mutation(ctx.conn, :disable_features, %{
                 company_id: Paths.company_id(ctx.company),
                 features: []
               })
    end

    test "is idempotent when removing a feature that is not enabled", ctx do
      {:ok, company} = Companies.enable_experimental_feature(ctx.company, "feature_a")

      assert {200, %{success: true}} =
               admin_mutation(ctx.conn, :disable_features, %{
                 company_id: Paths.company_id(company),
                 features: ["missing_feature"]
               })

      company = Repo.reload(company)
      assert company.enabled_experimental_features == ["feature_a"]
    end
  end
end
