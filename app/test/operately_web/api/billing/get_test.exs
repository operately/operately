defmodule OperatelyWeb.Api.Billing.GetTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.Billing

  describe "security" do
    setup :enable_instance_billing

    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = query(ctx.conn, [:billing, :get], %{})
    end

    test "it requires a company owner", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.enable_feature("billing")
        |> Factory.add_company_admin(:admin)
        |> Factory.log_in_person(:admin)

      assert {403, _} = query(ctx.conn, [:billing, :get], %{})
    end

    test "it returns not found when billing is disabled for the company", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)

      assert {404, _} = query(ctx.conn, [:billing, :get], %{})
    end
  end

  describe "functionality" do
    setup :setup_owner_ctx

    test "it returns free state when no Polar customer exists", ctx do
      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end do
        assert {200, res} = query(ctx.conn, [:billing, :get], %{})

        assert res.billing.account.status == "free"
        assert res.billing.account.plan_key == nil
        assert res.billing.account.billing_interval == nil
        assert res.billing.member_count == 2
        assert res.billing.stale == false
        assert length(res.billing.plans) == 3
        assert res.billing.catalog_products == []
      end
    end

    test "it returns normalized paid state and active catalog products", ctx do
      {:ok, _product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_team_monthly",
          polar_product_name: "Team Monthly",
          price_amount: 2900,
          price_currency: "usd",
          active: true
        })

      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id ->
          {:ok,
           %{
             "subscriptions" => [
               %{
                 "status" => "active",
                 "product_id" => "prod_team_monthly",
                 "current_period_end" => "2026-06-30T00:00:00Z",
                 "cancel_at_period_end" => false
               }
             ]
           }}
        end do
        assert {200, res} = query(ctx.conn, [:billing, :get], %{})

        assert res.billing.account.status == "active"
        assert res.billing.account.plan_key == "team"
        assert res.billing.account.billing_interval == "monthly"
        assert res.billing.account.cancel_at_period_end == false
        assert res.billing.member_count == 2
        assert res.billing.stale == false
        assert length(res.billing.catalog_products) == 1
        assert hd(res.billing.catalog_products).polar_product_id == "prod_team_monthly"
      end
    end

    test "it falls back to the local projection with stale=true when Polar is unavailable", ctx do
      {:ok, _account} =
        Billing.sync_billing_account(ctx.company, %{
          provider: "polar",
          plan_key: :business,
          billing_interval: :yearly,
          status: :active
        })

      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id -> {:error, :internal_server_error} end do
        assert {200, res} = query(ctx.conn, [:billing, :get], %{})

        assert res.billing.stale == true
        assert res.billing.account.status == "active"
        assert res.billing.account.plan_key == "business"
        assert res.billing.account.billing_interval == "yearly"
      end
    end
  end

  defp enable_instance_billing(_ctx) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)
    :ok
  end

  defp setup_owner_ctx(ctx) do
    enable_instance_billing(ctx)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("billing")
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:creator)

    {:ok, ctx}
  end
end
