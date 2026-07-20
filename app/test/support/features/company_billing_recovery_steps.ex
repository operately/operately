defmodule Operately.Support.Features.CompanyBillingRecoverySteps do
  use Operately.FeatureCase

  alias Operately.Billing
  alias Operately.InviteLinks

  import Operately.InviteLinksFixtures, only: [personal_invite_link_fixture: 1]

  step :enable_billing_for_company, ctx do
    Billing.create_product(%{
      provider: "polar",
      plan_family: "team",
      billing_interval: "monthly",
      polar_product_id: "feature-team-monthly-#{ctx.company.id}",
      active: true
    })

    ctx
  end

  step :fill_company_to_near_member_limit, ctx do
    needed_people = max(18 - Billing.active_member_count(ctx.company), 0)

    if needed_people > 0 do
      Enum.reduce(1..needed_people, ctx, fn index, acc ->
        Factory.add_company_member(acc, :"near_limit_member_#{index}", name: "Near Limit Member #{index}")
      end)
    else
      ctx
    end
  end

  step :put_company_in_payment_recovery, ctx, access_state do
    {:ok, _account} =
      Billing.create_billing_account(%{
        company_id: ctx.company.id,
        provider: "polar",
        plan_key: :team,
        billing_interval: :monthly,
        status: :past_due,
        access_state: access_state,
        access_state_reason: :past_due,
        access_state_started_at: ~U[2026-06-01 00:00:00Z],
        access_state_ends_at: if(access_state == :payment_grace, do: ~U[2026-06-15 00:00:00Z], else: nil)
      })

    ctx
  end

  def add_invited_company_member(ctx, key, name) do
    ctx = Factory.add_company_member(ctx, key, name: name, has_open_invitation: true)
    person = Map.fetch!(ctx, key)

    _invite_link =
      personal_invite_link_fixture(%{
        company_id: ctx.company.id,
        author_id: billing_actor(ctx).id,
        person_id: person.id
      })

    ctx
  end

  def add_expired_invited_company_member(ctx, key, name) do
    ctx = add_invited_company_member(ctx, key, name)
    person = Map.fetch!(ctx, key)
    {:ok, invite_link} = InviteLinks.get_personal_invite_link_for_person(person.id)

    {:ok, _invite_link} =
      Operately.Repo.update(
        Ecto.Changeset.change(invite_link, %{
          expires_at: DateTime.add(DateTime.utc_now(), -4, :day) |> DateTime.truncate(:second)
        })
      )

    ctx
  end

  step :assert_invite_people_button_hidden, ctx do
    ctx |> UI.refute_has(testid: "add-person")
  end

  step :assert_read_only_actions_for_company_member, ctx do
    person_id = Paths.person_id(ctx.member)

    ctx
    |> UI.click(testid: UI.testid(["person-options", person_id]))
    |> UI.refute_has(testid: UI.testid(["edit", person_id]))
    |> UI.refute_has(testid: "change-access-level")
    |> UI.refute_has(testid: UI.testid(["convert-to-guest", person_id]))
    |> UI.assert_has(testid: UI.testid(["remove-person", person_id]))
  end

  step :assert_rename_company_hidden_on_company_admin_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.assert_has(testid: "company-admin-page")
    |> UI.refute_has(testid: "rename-the-company")
  end

  step :assert_trusted_email_domains_hidden_on_company_admin_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.assert_has(testid: "company-admin-page")
    |> UI.refute_has(testid: "manage-trusted-email-domains")
  end

  step :assert_reissue_invitation_action_hidden_for, ctx, key do
    person = Map.fetch!(ctx, key)

    ctx
    |> UI.click(testid: UI.testid(["person-options", Paths.person_id(person)]))
    |> UI.refute_has(testid: UI.testid(["reissue-token", Paths.person_id(person)]))
  end

  step :assert_renew_invitation_action_hidden_for, ctx, key do
    person = Map.fetch!(ctx, key)

    ctx
    |> UI.click(testid: UI.testid(["person-options", Paths.person_id(person)]))
    |> UI.refute_has(testid: UI.testid(["renew-invitation", Paths.person_id(person)]))
  end

  step :assert_payment_default_banner_has_upgrade_cta, ctx do
    ctx
    |> UI.assert_has(testid: "payment-default-banner")
    |> UI.assert_has(testid: "payment-default-banner-cta")
  end

  step :assert_payment_default_banner_has_no_upgrade_cta, ctx do
    ctx
    |> UI.assert_has(testid: "payment-default-banner")
    |> UI.refute_has(testid: "payment-default-banner-cta")
  end

  step :assert_payment_default_banner_text, ctx, text do
    ctx |> UI.assert_text(text)
  end

  step :follow_payment_default_banner_cta, ctx do
    ctx
    |> UI.click(testid: "payment-default-banner-cta")
    |> UI.sleep(200)
    |> UI.assert_page(Paths.company_billing_path(ctx.company))
  end

  step :visit_company_billing_cancel_page, ctx do
    UI.visit(ctx, Paths.company_billing_path(ctx.company) <> "/cancel")
  end

  defp billing_actor(ctx) do
    ctx[:owner] || ctx[:admin] || ctx[:member] || ctx.creator
  end
end
