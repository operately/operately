defmodule Operately.Features.BillingTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.BillingSteps, as: Steps

  set_app_config(:billing_enabled, true)
  set_app_config(:billing_polar_client, Operately.Support.FakePolarClient)

  setup do
    previous_handlers = Application.get_env(:operately, :billing_polar_test_handlers, %{})
    Application.put_env(:operately, :billing_polar_test_handlers, %{})

    on_exit(fn ->
      Application.put_env(:operately, :billing_polar_test_handlers, previous_handlers)
    end)

    :ok
  end

  feature "logged-in billing intent opens the plan selection page with the requested plan preselected", ctx do
    ctx =
      ctx
      |> Steps.given_a_billing_enabled_company_exists()
      |> Steps.seed_active_billing_catalog()
      |> Steps.given_free_polar_state_agent()

    put_polar_handlers(%{
      get_customer_state_by_external_id: fn company_id ->
        assert company_id == ctx.company.id
        {:ok, Agent.get(ctx.polar_state_agent, & &1)}
      end
    })

    ctx
    |> Steps.visit_billing_intent(%{plan: "team", billing_period: "monthly"})
    |> Steps.assert_plan_selection_page_is_open(%{plan: "team", billing_period: "monthly"})
    |> Steps.assert_plan_card_is_selected(%{plan: "team", billing_period: "monthly"})
    |> Steps.assert_no_pending_checkout_is_recorded()
  end

  feature "free-company upgrades stop at the Polar handoff and resolve after webhook processing", ctx do
    ctx =
      ctx
      |> Steps.given_a_billing_enabled_company_exists()
      |> Steps.seed_active_billing_catalog()
      |> Steps.given_free_polar_state_agent()

    expected_checkout_url = "https://polar.sh/checkout/polar_c_feature"

    put_polar_handlers(%{
      get_customer_state_by_external_id: fn company_id ->
        assert company_id == ctx.company.id
        {:ok, Agent.get(ctx.polar_state_agent, & &1)}
      end,
      create_checkout_session: fn attrs ->
        assert attrs.products == [ctx.billing_products.business_yearly]
        assert attrs.external_customer_id == ctx.company.id
        assert String.ends_with?(attrs.return_url, "/admin/billing")
        assert String.contains?(attrs.success_url, "checkout_id={CHECKOUT_ID}")

        {:ok,
         %{
           "id" => "polar_c_feature",
           "url" => expected_checkout_url,
           "return_url" => attrs.return_url,
           "success_url" => attrs.success_url,
           "expires_at" => "2026-06-30T00:00:00Z"
         }}
      end
    })

    ctx
    |> Steps.visit_billing_overview_page()
    |> Steps.enable_billing_redirect_capture()
    |> Steps.open_plan_selection_from_billing_overview()
    |> Steps.select_billing_interval("yearly")
    |> Steps.select_billing_plan_card(%{plan: "business", billing_period: "yearly"})
    |> Steps.click_continue_to_checkout()
    |> Steps.assert_billing_redirect_was_captured(expected_checkout_url)
    |> Steps.visit_billing_overview_page_with_checkout_id("chk_feature")
    |> Steps.assert_checkout_confirmation_is_shown()
    |> Steps.simulate_successful_checkout_webhook(%{plan: "business", billing_interval: "yearly"})
    |> Steps.assert_upgrade_confirmed(%{plan: "business", billing_interval: "yearly"})
  end

  feature "paid-company plan switching updates the overview without leaving the app", ctx do
    ctx =
      ctx
      |> Steps.given_a_billing_enabled_company_exists()
      |> Steps.seed_active_billing_catalog()
      |> Steps.given_paid_polar_state_agent(%{plan: "team", billing_interval: "monthly"})

    put_polar_handlers(%{
      get_customer_state_by_external_id: fn company_id ->
        assert company_id == ctx.company.id
        {:ok, Agent.get(ctx.polar_state_agent, & &1)}
      end,
      update_subscription: fn "sub_feature_test", payload ->
        assert payload == %{product_id: ctx.billing_products.business_monthly, proration_behavior: "prorate"}

        Agent.update(ctx.polar_state_agent, fn _ ->
          %{
            "subscriptions" => [
              %{
                "id" => "sub_feature_test",
                "status" => "active",
                "product_id" => ctx.billing_products.business_monthly,
                "current_period_end" => "2026-06-30T00:00:00Z",
                "cancel_at_period_end" => false
              }
            ]
          }
        end)

        {:ok, %{"id" => "sub_feature_test"}}
      end
    })

    ctx
    |> Steps.visit_billing_overview_page()
    |> Steps.open_plan_selection_from_billing_overview()
    |> Steps.select_billing_plan_card(%{plan: "business", billing_period: "monthly"})
    |> Steps.click_change_plan()
    |> Steps.assert_plan_updated(%{plan: "business", billing_interval: "monthly"})
  end

  feature "company admin hides billing entry for companies without the billing feature", ctx do
    ctx
    |> Steps.given_a_company_exists_without_billing_feature()
    |> Steps.assert_billing_entry_is_hidden_on_company_admin_page()
  end

  defp put_polar_handlers(handlers) do
    Application.put_env(:operately, :billing_polar_test_handlers, handlers)
  end
end
