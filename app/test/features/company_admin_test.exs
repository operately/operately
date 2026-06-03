defmodule Operately.Features.CompanyAdminTest do
  use Operately.FeatureCase

  alias Operately.Billing
  alias Operately.Billing.Plans
  alias Operately.Support.Features.UI.Emails
  alias Operately.People
  alias Operately.Support.Features.CompanyAdminSteps, as: Steps

  import Operately.BlobsFixtures

  set_app_config(:billing_enabled, true)

  setup ctx do
    ctx
    |> Steps.given_a_company_exists()
    |> Steps.given_i_am_logged_in(as: ctx[:role])
  end

  @tag role: :admin
  feature "adding a new person to the company", ctx do
    params = %{
      full_name: "Michael Scott",
      email: "m.scott@dmif.com",
      title: "Regional Manager"
    }

    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(params)
    |> Steps.assert_invitation_url_is_generated()
    |> Steps.open_company_team_page()
    |> Steps.assert_new_company_member_is_listed("Michael Scott")
    |> Steps.assert_company_member_details_match_invitations(params)
    |> Steps.assert_expiration_date_is_visible_on_team_page()
  end

  @tag role: :owner
  feature "adding a new person is blocked when the company is already full", ctx do
    params = %{
      full_name: "Limit Blocked Member",
      email: "limit.blocked.member@example.com",
      title: "Designer"
    }

    ctx
    |> enable_billing_for_company()
    |> fill_company_to_member_limit()
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(params)
    |> Steps.assert_limit_guidance_has_upgrade_cta()
    |> Steps.follow_limit_guidance_upgrade_cta()
    |> assert_no_person_added(params.email)
  end

  @tag role: :owner
  feature "reaching the member limit sends one upgrade email for the breach episode", ctx do
    first_params = %{
      full_name: "Threshold Member",
      email: "threshold.member@example.com",
      title: "Designer"
    }

    second_params = %{
      full_name: "Blocked Member",
      email: "blocked.member@example.com",
      title: "Engineer"
    }

    ctx
    |> enable_billing_for_company()
    |> fill_company_to_one_below_member_limit()
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(first_params)
    |> assert_limit_reached_email(:member_count, [ctx.creator.email, ctx.owner.email])
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(second_params)
    |> Steps.assert_limit_guidance_has_upgrade_cta()
    |> assert_limit_reached_email_sent_once(:member_count)
  end

  @tag role: :owner
  feature "inviting an outside collaborator is blocked when the company is already full", ctx do
    params = %{
      full_name: "Limit Blocked Collaborator",
      email: "limit.blocked.collaborator@example.com",
      title: "Advisor"
    }

    ctx
    |> enable_billing_for_company()
    |> fill_company_to_member_limit()
    |> Steps.open_company_team_page()
    |> Steps.invite_outside_collaborator(params)
    |> Steps.assert_limit_guidance_has_upgrade_cta()
    |> assert_no_person_added(params.email)
  end

  @tag role: :member
  feature "member can't add person to company", ctx do
    ctx
    |> Steps.visit_company_admin_page()
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.assert_cannot_add_person_to_company()
  end

  @tag role: :owner
  feature "promote a person to admin", ctx do
    ctx
    |> Steps.given_a_company_member_exists()
    |> Steps.open_manage_admins_page()
    |> Steps.add_company_admin()
    |> Steps.assert_person_is_admin()
  end

  @tag role: :admin
  feature "admins can't promote to admin", ctx do
    ctx
    |> Steps.visit_company_admin_page()
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.assert_cannot_promote_to_admin()
  end

  @tag role: :owner
  feature "demote a person from admin", ctx do
    ctx
    |> Steps.given_a_company_admin_exists()
    |> Steps.open_manage_admins_page()
    |> Steps.remove_company_admin()
    |> Steps.refute_person_is_admin()
  end

  @tag role: :owner
  feature "add a new account owner", ctx do
    ctx
    |> Steps.given_a_company_member_exists()
    |> Steps.open_manage_admins_page()
    |> Steps.add_company_owner()
    |> Steps.assert_person_is_owner()
    |> Steps.assert_feed_item_for_new_owner()
    |> Steps.assert_notification_and_email_sent_to_new_owner()
  end

  @tag role: :owner
  feature "remove account owner", ctx do
    ctx
    |> Steps.given_a_company_owner_exists()
    |> Steps.open_manage_admins_page()
    |> Steps.remove_company_owner()
    |> Steps.refute_person_is_owner()
    |> Steps.assert_feed_item_for_removed_owner()
    |> Steps.assert_notification_and_email_sent_to_removed_owner()
  end

  @tag role: :admin
  feature "edit member's access levels", ctx do
    ctx
    |> Steps.given_a_company_owner_exists()
    |> Steps.given_a_company_member_exists()
    |> Steps.open_company_team_page()
    |> Steps.assert_company_member_access_level_is_updated(:view_access)
    |> Steps.edit_company_member_access_level(:edit_access)
    |> Steps.assert_company_member_access_level_is_updated(:edit_access)
  end

  @tag role: :admin
  feature "edit a person's details", ctx do
    ctx
    |> Steps.given_a_company_member_exists()
    |> Steps.open_company_team_page()
    |> Steps.edit_company_member(%{name: "Michael Scott", new_title: "Regional Manager", new_name: "Michael G. Scott"})
    |> Steps.assert_company_member_details_updated(%{
      name: "Michael G. Scott",
      title: "Regional Manager"
    })
  end

  @tag role: :admin
  feature "convert a team member to outside collaborator", ctx do
    ctx
    |> Steps.given_a_company_member_exists()
    |> Steps.open_company_team_page()
    |> Steps.convert_company_member_to_guest()
    |> Steps.assert_company_member_moved_to_outside_collaborators_section()
    |> Steps.assert_company_member_converted_to_guest()
    |> Steps.assert_feed_item_notification_and_email_sent_to_converted_guest()
  end

  @tag role: :owner
  feature "adding a trusted email domain", ctx do
    ctx
    |> Steps.open_company_trusted_email_domains_page()
    |> Steps.add_trusted_email_domain("@dmif.com")
    |> Steps.assert_trusted_email_domain_added("@dmif.com")
  end

  @tag role: :owner
  feature "removing a trusted email domain", ctx do
    ctx
    |> Steps.given_the_company_has_trusted_email_domains(["@dmif.com"])
    |> Steps.open_company_trusted_email_domains_page()
    |> Steps.remove_trusted_email_domain("@dmif.com")
    |> Steps.assert_truested_email_domain_list_empty()
  end

  @tag role: :admin
  feature "remove members from the company", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.given_a_company_member_exists()
    |> Steps.open_company_team_page()
    |> Steps.assert_company_member_is_listed()
    |> Steps.remove_company_member()
    |> Steps.assert_member_removed()
  end

  @tag role: :admin
  feature "revoke a member's invitation", ctx do
    params = %{
      full_name: "Invited Person",
      email: "invited.person@example.com",
      title: "Potential Employee"
    }

    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.open_company_team_page()
    |> Steps.invite_company_member(params)
    |> Steps.open_company_team_page()
    |> Steps.assert_new_company_member_is_listed(params.full_name)
    |> Steps.revoke_member_invitation(params.full_name)
    |> Steps.assert_invitation_revoked(params)
  end

  @tag role: :admin
  feature "restore removed member", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.given_a_company_admin_exists()
    |> Steps.given_a_removed_company_member_exists()
    |> Steps.open_restore_people_page()
    |> Steps.assert_removed_person_is_listed()
    |> Steps.restore_company_member()
    |> Steps.assert_no_suspended_people_message_is_displayed()
    |> Steps.assert_member_restored()
    |> Steps.assert_feed_item_notification_and_email_sent_to_restored_member()
  end

  @tag role: :admin
  feature "restoring a removed member is blocked when the company is already full", ctx do
    ctx
    |> enable_billing_for_company()
    |> Steps.given_a_removed_company_member_exists()
    |> fill_company_to_member_limit()
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.open_restore_people_page()
    |> Steps.assert_removed_person_is_listed()
    |> Steps.restore_company_member()
    |> Steps.assert_limit_guidance_has_no_upgrade_cta()
    |> assert_member_still_suspended(:suspended)
  end

  @tag role: :member
  feature "member can't restore other members", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_admin_page()
    |> Steps.assert_cannot_restore_member()
  end

  @tag role: :admin
  feature "visiting the company admin page as an admin", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.assert_i_dont_see_reach_out_to_admins()
  end

  @tag role: :owner
  feature "near-limit usage does not show a company billing banner", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_to_near_member_limit()
    |> Steps.visit_company_home_page()
    |> Steps.refute_company_billing_banner_visible()
  end

  @tag role: :member
  feature "regular members see a blocked member-limit danger banner without a CTA", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_member_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_no_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Contact a company admin or owner.")
  end

  @tag role: :member
  feature "regular members see a blocked storage-limit danger banner without a CTA", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_storage_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_no_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Contact a company admin or owner.")
  end

  @tag role: :owner
  feature "owner sees an urgent over-limit banner when the company is over the member limit", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_member_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.follow_company_billing_banner_upgrade_cta()
  end

  @tag role: :admin
  feature "company admin sees an urgent over-limit banner with a CTA when storage is over the limit", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_storage_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
  end

  @tag role: :owner
  feature "mixed blocked and near-limit states show one urgent banner with both rows", ctx do
    ctx
    |> enable_billing_for_company()
    |> fill_company_beyond_member_limit()
    |> fill_company_to_near_storage_limit()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_billing_banner_has_upgrade_cta()
    |> Steps.assert_company_billing_banner_has_no_dismiss_action()
    |> Steps.assert_company_billing_banner_text("This company is over its plan limits")
    |> Steps.assert_company_billing_banner_text("Active members:")
    |> Steps.assert_company_billing_banner_text("Storage used:")
  end

  @tag role: :admin
  feature "rename company", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.open_company_admins_page()
    |> Steps.click_rename_company()
    |> Steps.fill_in_new_company_name_and_submit()
    |> Steps.assert_company_name_is_changed()
    |> Steps.assert_company_name_is_changed_in_navbar()
    |> Steps.assert_company_feed_shows_the_company_name_change()
  end

  @tag role: :member
  feature "member can't rename company", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_admin_page()
    |> Steps.assert_rename_company_not_visible()
  end

  @tag role: :owner
  feature "Delete company", ctx do
    ctx
    |> Steps.add_second_company_with_resources()
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.click_delete_company()
    |> Steps.confirm_delete_company()
    |> Steps.assert_redirected_to_lobby()
    |> Steps.assert_company_is_deleted()
    |> Steps.assert_other_company_is_intact()
  end

  @tag role: :admin
  feature "Admin cannot see delete company option", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.assert_delete_company_not_visible()
  end

  @tag role: :member
  feature "member gets 404 when manually navigates to manage-people page", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_manage_people_page()
    |> Steps.assert_404()
  end

  @tag role: :member
  feature "member gets 404 when manually navigates to member type selection page", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_member_type_selection_page()
    |> Steps.assert_404()
  end

  @tag role: :member
  feature "member gets 404 when manually navigates to invite person page", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_invite_person_page()
    |> Steps.assert_404()
  end

  describe "form validation" do
    @tag role: :admin
    feature "missing full name", ctx do
      params = %{
        full_name: "",
        email: "m.scott@dmif.com",
        title: "Regional Manager"
      }
      error = "Name is required"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end

    @tag role: :admin
    feature "missing email", ctx do
      params = %{
        full_name: "Michael Scott",
        email: "",
        title: "Regional Manager"
      }
      error = "Email is required"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end

    @tag role: :admin
    feature "missing title", ctx do
      params = %{
        full_name: "Michael Scott",
        email: "m.scott@dmif.com",
        title: ""
      }
      error = "Title is required"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end

    @tag role: :admin
    feature "invalid email", ctx do
      params = %{
        full_name: "Michael Scott",
        email: "m.scott",
        title: "Regional Manager"
      }
      error = "Enter a valid email address"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end
  end

  defp enable_billing_for_company(ctx) do
    Billing.create_product(%{
      provider: "polar",
      plan_family: "team",
      billing_interval: "monthly",
      polar_product_id: "feature-team-monthly-#{ctx.company.id}",
      active: true
    })

    Factory.enable_feature(ctx, "billing")
  end

  defp fill_company_to_member_limit(ctx) do
    needed_people = max(20 - Billing.active_member_count(ctx.company), 0)

    if needed_people > 0 do
      Enum.reduce(1..needed_people, ctx, fn index, acc ->
        Factory.add_company_member(acc, :"limit_member_#{index}", name: "Limit Member #{index}")
      end)
    else
      ctx
    end
  end

  defp fill_company_to_one_below_member_limit(ctx) do
    needed_people = max(19 - Billing.active_member_count(ctx.company), 0)

    if needed_people > 0 do
      Enum.reduce(1..needed_people, ctx, fn index, acc ->
        Factory.add_company_member(acc, :"almost_limit_member_#{index}", name: "Almost Limit Member #{index}")
      end)
    else
      ctx
    end
  end

  defp fill_company_to_near_member_limit(ctx) do
    needed_people = max(18 - Billing.active_member_count(ctx.company), 0)

    if needed_people > 0 do
      Enum.reduce(1..needed_people, ctx, fn index, acc ->
        Factory.add_company_member(acc, :"near_limit_member_#{index}", name: "Near Limit Member #{index}")
      end)
    else
      ctx
    end
  end

  defp fill_company_to_near_storage_limit(ctx) do
    author = ctx[:owner] || ctx[:admin] || ctx[:member] || ctx.creator

    blob_fixture(%{
      company_id: ctx.company.id,
      author_id: author.id,
      status: :uploaded,
      size: trunc(Plans.storage_limit_bytes(:free) * 0.95)
    })

    ctx
  end

  defp fill_company_beyond_member_limit(ctx) do
    ctx
    |> fill_company_to_member_limit()
    |> Factory.add_company_member(:over_limit_member, name: "Over Limit Member")
  end

  defp fill_company_beyond_storage_limit(ctx) do
    author = ctx[:owner] || ctx[:admin] || ctx[:member] || ctx.creator

    blob_fixture(%{
      company_id: ctx.company.id,
      author_id: author.id,
      status: :uploaded,
      size: trunc(Plans.storage_limit_bytes(:free) * 1.05)
    })

    ctx
  end

  defp assert_no_person_added(ctx, email) do
    refute People.get_person_by_email(ctx.company, email)
    ctx
  end

  defp assert_limit_reached_email(ctx, :member_count, recipients) do
    subject = "#{ctx.company.name} has reached its member limit"
    Enum.each(recipients, &Emails.assert_email_sent(subject, &1))

    ctx
  end

  defp assert_limit_reached_email_sent_once(ctx, :member_count) do
    subject = "#{ctx.company.name} has reached its member limit"

    attempts(ctx, 20, fn ->
      emails = Enum.filter(Emails.list_sent_emails(), &(&1.subject == subject))
      assert length(emails) == 1
    end)

    ctx
  end

  defp assert_member_still_suspended(ctx, key) do
    person = Map.fetch!(ctx, key) |> Operately.Repo.reload()

    assert person.suspended
    assert person.suspended_at != nil

    ctx
  end
end
