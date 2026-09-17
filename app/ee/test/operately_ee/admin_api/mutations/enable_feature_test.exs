defmodule OperatelyEE.AdminApi.Mutations.EnableFeatureTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :enable_feature, %{
                 company_id: Operately.Companies.ShortId.encode!(999_999_999),
                 feature: "some_feature"
               })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :enable_feature, %{
                 company_id: Paths.company_id(ctx.company),
                 feature: "some_feature"
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

    test "enables a feature on a company", ctx do
      assert {200, %{success: true}} =
               admin_mutation(ctx.conn, :enable_feature, %{
                 company_id: Paths.company_id(ctx.company),
                 feature: "feature_a"
               })

      company = Repo.reload(ctx.company)
      assert company.enabled_experimental_features == ["feature_a"]
    end

    test "trims whitespace from the feature name", ctx do
      assert {200, %{success: true}} =
               admin_mutation(ctx.conn, :enable_feature, %{
                 company_id: Paths.company_id(ctx.company),
                 feature: "  feature_a  "
               })

      company = Repo.reload(ctx.company)
      assert company.enabled_experimental_features == ["feature_a"]
    end

    test "is idempotent when the feature is already enabled", ctx do
      {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "feature_a")

      assert {200, %{success: true}} =
               admin_mutation(ctx.conn, :enable_feature, %{
                 company_id: Paths.company_id(company),
                 feature: "feature_a"
               })

      company = Repo.reload(company)
      assert company.enabled_experimental_features == ["feature_a"]
    end

    test "returns not found for an unknown company", ctx do
      assert {404, _} =
               admin_mutation(ctx.conn, :enable_feature, %{
                 company_id: Operately.Companies.ShortId.encode!(999_999_999),
                 feature: "some_feature"
               })
    end

    test "returns bad request for a blank feature name", ctx do
      assert {400, _} =
               admin_mutation(ctx.conn, :enable_feature, %{
                 company_id: Paths.company_id(ctx.company),
                 feature: "   "
               })

      company = Repo.reload(ctx.company)
      assert company.enabled_experimental_features == []
    end
  end
end
