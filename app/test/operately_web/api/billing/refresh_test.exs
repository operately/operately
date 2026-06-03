defmodule OperatelyWeb.Api.Billing.RefreshTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.Billing

  describe "security" do
    setup :enable_instance_billing

    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = mutation(ctx.conn, [:billing, :refresh], %{})
    end

    test "it allows a company admin", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.enable_feature("billing")
        |> Factory.add_company_admin(:admin)
        |> Factory.log_in_person(:admin)

      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end do
        assert {200, res} = mutation(ctx.conn, [:billing, :refresh], %{})
        assert res.billing.account.status == "free"
      end
    end

    test "it rejects regular members", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.enable_feature("billing")
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:billing, :refresh], %{})
    end

    test "it returns not found when billing is disabled for the company", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)

      assert {404, _} = mutation(ctx.conn, [:billing, :refresh], %{})
    end
  end

  describe "functionality" do
    setup :setup_owner_ctx

    test "it returns an error when Polar is unavailable", ctx do
      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id -> {:error, :internal_server_error} end do
        assert {500, _} = mutation(ctx.conn, [:billing, :refresh], %{})
      end
    end

    test "it returns an error when Polar rejects the request", ctx do
      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id -> {:error, :bad_request} end do
        assert {500, _} = mutation(ctx.conn, [:billing, :refresh], %{})
      end
    end

    test "it performs a strict live sync", ctx do
      {:ok, _product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "business",
          billing_interval: "yearly",
          polar_product_id: "prod_business_yearly",
          active: true
        })

      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id ->
          {:ok,
           %{
             "subscriptions" => [
               %{
                 "status" => "active",
                 "product_id" => "prod_business_yearly",
                 "current_period_end" => "2026-12-31T00:00:00Z",
                 "cancel_at_period_end" => true
               }
             ]
           }}
        end do
        assert {200, res} = mutation(ctx.conn, [:billing, :refresh], %{})

        assert res.billing.stale == false
        assert res.billing.account.status == "active"
        assert res.billing.account.plan_key == "business"
        assert res.billing.account.billing_interval == "yearly"
        assert res.billing.account.cancel_at_period_end == true
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
