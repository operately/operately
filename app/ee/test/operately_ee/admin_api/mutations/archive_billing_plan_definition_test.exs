defmodule OperatelyEE.AdminApi.Mutations.ArchiveBillingPlanDefinitionTest do
  use OperatelyWeb.TurboCase

  alias Operately.Billing
  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :archive_billing_plan_definition, %{id: Operately.ShortUuid.encode!(Ecto.UUID.generate())})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :archive_billing_plan_definition, %{id: Operately.ShortUuid.encode!(Ecto.UUID.generate())})
    end
  end

  describe "functionality" do
    setup ctx do
      Application.put_env(:operately, :billing_enabled, true)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "archives a non-free plan", ctx do
      team_plan =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "team"))

      assert {200, %{plan_definition: archived}} =
               admin_mutation(ctx.conn, :archive_billing_plan_definition, %{
                 id: OperatelyWeb.Paths.billing_plan_definition_id(team_plan)
               })

      assert archived.archived_at != nil
      assert Billing.get_plan_definition!(team_plan.id).archived_at != nil
    end

    test "rejects archiving the free plan", ctx do
      free_plan =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "free"))

      assert {400, _} =
               admin_mutation(ctx.conn, :archive_billing_plan_definition, %{
                 id: OperatelyWeb.Paths.billing_plan_definition_id(free_plan)
               })
    end
  end
end
