defmodule Operately.Support.Features.BillingSteps do
  use Operately.FeatureCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Billing
  alias Operately.Billing.Polar.ProcessWebhookWorker
  alias Operately.Billing.WebhookEvent
  alias Operately.Repo
  alias Operately.Support.Features.UI
  alias Wallaby.Browser

  step :given_a_billing_enabled_company_exists, ctx do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("billing")
    |> Factory.log_in_person(:creator)
  end

  step :given_a_company_exists_without_billing_feature, ctx do
    ctx
    |> Factory.setup()
    |> Factory.log_in_person(:creator)
  end

  step :seed_active_billing_catalog, ctx do
    products = %{
      team_monthly: create_active_product("prod_team_monthly", "team", "monthly").polar_product_id,
      team_yearly: create_active_product("prod_team_yearly", "team", "yearly").polar_product_id,
      business_monthly: create_active_product("prod_business_monthly", "business", "monthly").polar_product_id,
      business_yearly: create_active_product("prod_business_yearly", "business", "yearly").polar_product_id,
    }

    Map.put(ctx, :billing_products, products)
  end

  step :given_free_polar_state_agent, ctx do
    agent = start_supervised!({Agent, fn -> free_customer_state_payload() end})
    Map.put(ctx, :polar_state_agent, agent)
  end

  step :given_paid_polar_state_agent, ctx, attrs do
    product_id = billing_product_id(ctx, attrs.plan, attrs.billing_interval)
    payload = active_subscription_payload(product_id, attrs[:overrides] || %{})
    agent = start_supervised!({Agent, fn -> payload end})

    Map.put(ctx, :polar_state_agent, agent)
  end

  step :visit_billing_intent, ctx, attrs do
    query =
      URI.encode_query(%{
        plan: attrs.plan,
        billing_period: attrs.billing_period,
      })

    UI.visit(ctx, "/billing/intent?" <> query)
  end

  step :visit_billing_overview_page, ctx do
    UI.visit(ctx, OperatelyWeb.Paths.company_billing_path(ctx.company))
  end

  step :visit_billing_overview_page_with_checkout_id, ctx, checkout_id do
    UI.visit(ctx, OperatelyWeb.Paths.company_billing_path(ctx.company) <> "?checkout_id=#{checkout_id}")
  end

  step :assert_plan_selection_page_is_open, ctx, attrs do
    expected_path = billing_plan_selection_path(ctx.company, attrs.plan, attrs.billing_period)
    expected_base_path = billing_plan_selection_base_path(ctx.company)
    current_path = Browser.current_path(ctx.session)

    assert current_path in [expected_path, expected_base_path]

    ctx
    |> UI.assert_has(testid: "company-billing-plan-selection-page")
  end

  step :assert_plan_card_is_selected, ctx, attrs do
    UI.find(ctx, [testid: billing_plan_card_test_id(attrs.plan, attrs.billing_period)], fn card ->
      UI.assert_text(card, "Selected")
    end)
  end

  step :assert_no_pending_checkout_is_recorded, ctx do
    account = Billing.get_billing_account_by_company(ctx.company)

    assert account
    assert account.pending_plan_key == nil
    assert account.pending_billing_interval == nil
    assert account.pending_checkout_started_at == nil

    ctx
  end

  # Used to prevent external redirects during feature tests.
  step :enable_billing_redirect_capture, ctx do
    script = """
    window.__tests = window.__tests || {};
    window.__tests.billing = { captureExternalNavigation: true, externalNavigations: [] };
    """

    Map.update!(ctx, :session, &Browser.execute_script(&1, script))
  end

  step :open_plan_selection_from_billing_overview, ctx do
    ctx
    |> UI.click_button("Switch Plan")
    |> UI.assert_has(testid: "company-billing-plan-selection-page")
  end

  step :select_billing_interval, ctx, interval do
    label =
      case interval do
        "monthly" -> "Monthly"
        "yearly" -> "Yearly"
      end

    UI.click_button(ctx, label)
  end

  step :select_billing_plan_card, ctx, attrs do
    UI.click(ctx, testid: billing_plan_card_test_id(attrs.plan, attrs.billing_period))
  end

  step :click_continue_to_checkout, ctx do
    UI.click_button(ctx, "Continue to checkout")
  end

  step :click_change_plan, ctx do
    UI.click_button(ctx, "Change plan")
  end

  step :assert_billing_redirect_was_captured, ctx, expected_url do
    redirects = wait_for_redirects(ctx.session)

    assert redirects == [expected_url]

    Map.put(ctx, :captured_billing_redirects, redirects)
  end

  step :assert_checkout_confirmation_is_shown, ctx do
    ctx
    |> UI.assert_text("Confirming your upgrade")
    |> UI.assert_text("This page will update automatically")
  end

  step :simulate_successful_checkout_webhook, ctx, attrs do
    Agent.update(ctx.polar_state_agent, fn _ ->
      active_subscription_payload(billing_product_id(ctx, attrs.plan, attrs.billing_interval), attrs[:overrides] || %{})
    end)

    webhook_event = create_webhook_event(ctx.company.id)

    assert :ok = perform_job(ProcessWebhookWorker, %{billing_webhook_event_id: webhook_event.id})

    ctx
  end

  step :assert_upgrade_confirmed, ctx, attrs do
    attempts(ctx, 10, fn ->
      account = Billing.get_billing_account_by_company(ctx.company)

      assert account.status == :active
      assert account.plan_key == to_existing_atom(attrs.plan)
      assert account.billing_interval == to_existing_atom(attrs.billing_interval)
      assert account.pending_plan_key == nil
      assert account.pending_billing_interval == nil
      assert account.pending_checkout_started_at == nil

      ctx
      |> UI.assert_page(OperatelyWeb.Paths.company_billing_path(ctx.company))
      |> UI.assert_text("Upgrade confirmed")
      |> UI.assert_text(plan_display_name(attrs.plan))
    end)
  end

  step :assert_plan_updated, ctx, attrs do
    attempts(ctx, 10, fn ->
      account = Billing.get_billing_account_by_company(ctx.company)

      assert account.status == :active
      assert account.plan_key == to_existing_atom(attrs.plan)
      assert account.billing_interval == to_existing_atom(attrs.billing_interval)

      ctx
      |> UI.assert_page(OperatelyWeb.Paths.company_billing_path(ctx.company))
      |> UI.assert_text("Plan updated")
      |> UI.assert_text(plan_display_name(attrs.plan))
    end)
  end

  step :assert_billing_entry_is_hidden_on_company_admin_page, ctx do
    ctx
    |> UI.visit(OperatelyWeb.Paths.company_admin_path(ctx.company))
    |> UI.assert_has(testid: "company-admin-page")
    |> UI.assert_has(testid: "manage-administrators-and-owners")
    |> UI.refute_has(testid: "manage-plan")
  end

  defp create_active_product(polar_product_id, plan_family, billing_interval) do
    {:ok, product} =
      Billing.create_product(%{
        provider: "polar",
        plan_family: plan_family,
        billing_interval: billing_interval,
        polar_product_id: polar_product_id,
      })

    {:ok, product} = Billing.set_active_product(product)
    product
  end

  defp billing_plan_selection_path(company, plan, billing_period) do
    billing_plan_selection_base_path(company) <>
      "?" <> URI.encode_query(%{plan: plan, billing_period: billing_period})
  end

  defp billing_plan_selection_base_path(company) do
    OperatelyWeb.Paths.company_billing_path(company) <> "/plans"
  end

  defp billing_plan_card_test_id(plan, billing_period) do
    "billing-plan-card-#{plan}-#{billing_period}"
  end

  defp wait_for_redirects(session, attempts \\ [50, 150, 250, 400, 1000])

  defp wait_for_redirects(session, []) do
    redirects = captured_redirects(session)
    assert redirects != []
    redirects
  end

  defp wait_for_redirects(session, [delay | remaining_attempts]) do
    Process.sleep(delay)

    case captured_redirects(session) do
      [] -> wait_for_redirects(session, remaining_attempts)
      redirects -> redirects
    end
  end

  defp captured_redirects(session) do
    Browser.execute_script(
      session,
      "return (window.__tests && window.__tests.billing && window.__tests.billing.externalNavigations) || [];",
      fn result -> send(self(), {:captured_billing_redirects, result}) end
    )

    receive do
      {:captured_billing_redirects, redirects} -> redirects
    end
  end

  defp free_customer_state_payload do
    %{"subscriptions" => []}
  end

  defp active_subscription_payload(product_id, overrides) do
    subscription =
      %{
        "id" => "sub_feature_test",
        "status" => "active",
        "product_id" => product_id,
        "current_period_end" => "2026-06-30T00:00:00Z",
        "cancel_at_period_end" => false,
      }
      |> Map.merge(overrides)

    %{"subscriptions" => [subscription]}
  end

  defp billing_product_id(ctx, plan, billing_interval) do
    Map.fetch!(ctx.billing_products, String.to_existing_atom("#{plan}_#{billing_interval}"))
  end

  defp plan_display_name("team"), do: "Team"
  defp plan_display_name("business"), do: "Business"

  defp to_existing_atom(value) when is_binary(value), do: String.to_existing_atom(value)
  defp to_existing_atom(value), do: value

  defp create_webhook_event(company_id) do
    %WebhookEvent{}
    |> WebhookEvent.changeset(%{
      provider: "polar",
      event_id: Ecto.UUID.generate(),
      event_type: "customer.state_changed",
      payload: %{
        "type" => "customer.state_changed",
        "data" => %{"external_id" => company_id},
      },
      received_at: DateTime.utc_now() |> DateTime.truncate(:second),
      status: :pending,
    })
    |> Repo.insert!()
  end
end
