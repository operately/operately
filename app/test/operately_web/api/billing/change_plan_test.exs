defmodule OperatelyWeb.Api.Billing.ChangePlanTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.Billing

  describe "security" do
    setup :enable_instance_billing

    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "team", billing_interval: "monthly"})
    end

    test "it requires a company owner", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.enable_feature("billing")
        |> Factory.add_company_admin(:admin)
        |> Factory.log_in_person(:admin)

      assert {403, _} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "team", billing_interval: "monthly"})
    end

    test "it returns not found when billing is disabled for the company", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)

      assert {404, _} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "team", billing_interval: "monthly"})
    end
  end

  describe "functionality" do
    setup :setup_owner_ctx

    test "it returns refreshed billing overview for an immediate upgrade", ctx do
      {:ok, _current_product} = create_active_product("prod_team_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_yearly", "business", "yearly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_team_monthly", %{"id" => "sub_upgrade"})},
        {:ok, active_subscription_payload("prod_business_yearly", %{"id" => "sub_upgrade"})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_upgrade", %{product_id: "prod_business_yearly", proration_behavior: "prorate"} ->
          {:ok, %{"id" => "sub_upgrade"}}
        end do
        assert {200, res} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "business", billing_interval: "yearly"})

        assert res.billing.account.plan_key == "business"
        assert res.billing.account.billing_interval == "yearly"
        assert res.billing.account.scheduled_plan_key == nil
      end
    end

    test "it returns scheduled change fields for next-period changes", ctx do
      {:ok, _current_product} = create_active_product("prod_business_yearly", "business", "yearly")
      {:ok, _target_product} = create_active_product("prod_team_yearly", "team", "yearly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_business_yearly", %{"id" => "sub_downgrade"})},
        {:ok,
         active_subscription_payload("prod_business_yearly", %{
           "id" => "sub_downgrade",
           "pending_update" => %{"product_id" => "prod_team_yearly"}
         })}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_downgrade", %{product_id: "prod_team_yearly", proration_behavior: "next_period"} ->
          {:ok, %{"id" => "sub_downgrade"}}
        end do
        assert {200, res} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "team", billing_interval: "yearly"})

        assert res.billing.account.plan_key == "business"
        assert res.billing.account.billing_interval == "yearly"
        assert res.billing.account.scheduled_plan_key == "team"
        assert res.billing.account.scheduled_billing_interval == "yearly"
        assert res.billing.account.scheduled_change_effective_at == "2026-06-30T00:00:00Z"
      end
    end

    test "it rejects invalid inputs", ctx do
      assert {400, _} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "free", billing_interval: "monthly"})
      assert {400, _} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "team", billing_interval: "weekly"})
    end

    test "it rejects unsupported subscription states", ctx do
      {:ok, _current_product} = create_active_product("prod_team_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_monthly", "business", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_team_monthly", %{"id" => "sub_trialing", "status" => "trialing"})}
        end,
        update_subscription: fn _subscription_id, _attrs -> flunk("unexpected update call") end do
        assert {400, _} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "business", billing_interval: "monthly"})
      end
    end

    test "it returns not found when there is no live subscription", ctx do
      {:ok, _target_product} = create_active_product("prod_team_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        update_subscription: fn _subscription_id, _attrs -> flunk("unexpected update call") end do
        assert {404, _} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "team", billing_interval: "monthly"})
      end
    end

    test "it returns provider failures", ctx do
      {:ok, _current_product} = create_active_product("prod_team_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_monthly", "business", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_team_monthly", %{"id" => "sub_failure"})}
        end,
        update_subscription: fn "sub_failure", %{product_id: "prod_business_monthly", proration_behavior: "prorate"} ->
          {:error, :internal_server_error}
        end do
        assert {500, _} = mutation(ctx.conn, [:billing, :change_plan], %{plan: "business", billing_interval: "monthly"})
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

  defp create_active_product(polar_product_id, plan_family, billing_interval) do
    with {:ok, product} <-
           Billing.create_product(%{
             provider: "polar",
             plan_family: plan_family,
             billing_interval: billing_interval,
             polar_product_id: polar_product_id
           }),
         {:ok, product} <- Billing.set_active_product(product) do
      {:ok, product}
    end
  end

  defp active_subscription_payload(product_id, overrides) do
    subscription =
      %{
        "id" => "sub_test",
        "status" => "active",
        "product_id" => product_id,
        "current_period_end" => "2026-06-30T00:00:00Z",
        "cancel_at_period_end" => false
      }
      |> Map.merge(overrides)

    %{"subscriptions" => [subscription]}
  end

  defp put_sequence(key, values) do
    Process.put(key, values)
  end

  defp next_sequence(key) do
    case Process.get(key, []) do
      [value | rest] ->
        Process.put(key, rest)
        value

      [] ->
        flunk("No queued sequence value for #{inspect(key)}")
    end
  end
end
