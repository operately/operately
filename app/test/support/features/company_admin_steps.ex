defmodule Operately.Support.Features.CompanyAdminSteps do
  use Operately.FeatureCase

  alias Operately.People.Person
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  step :given_a_company_exists, ctx do
    ctx |> Factory.setup()
  end

  step :given_i_am_logged_in, ctx, as: role do
    cond do
      role == :admin ->
        ctx
        |> Factory.add_company_admin(:admin, name: "Admin Adminson")
        |> Factory.log_in_person(:admin)

      role == :owner ->
        ctx
        |> Factory.add_company_owner(:owner, name: "Owner Ownerson")
        |> Factory.log_in_person(:owner)

      role == :member ->
        ctx
        |> Factory.add_company_member(:member, name: "Member Memberson")
        |> Factory.log_in_person(:member)
    end
  end

  step :open_company_team_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.click(testid: "manage-team-members")
  end

  step :open_company_admins_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.assert_has(testid: "company-admin-page")
  end

  step :open_manage_admins_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.click(testid: "manage-administrators-and-owners")
    |> UI.assert_has(testid: "manage-admins-page")
  end

  step :open_company_trusted_email_domains_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.click(testid: "manage-trusted-email-domains")
  end

  step :invite_company_member, ctx, params do
    ctx
    |> UI.click(testid: "add-person")
    |> UI.fill(testid: "fullname", with: params[:full_name])
    |> UI.fill(testid: "email", with: params[:email])
    |> UI.fill(testid: "title", with: params[:title])
    |> UI.click(testid: "submit")
  end

  step :add_company_admin, ctx do
    ctx
    |> UI.click(testid: "add-admins")
    |> UI.fill(Query.css("#people-search"), with: String.slice(ctx.member.full_name, 0, 4))
    |> UI.assert_text(ctx.member.full_name)
    |> UI.send_keys([:enter])
    |> UI.click(testid: "save-admins")
    |> UI.sleep(500)
  end

  step :remove_company_admin, ctx do
    ctx
    |> UI.assert_text(ctx.admin.full_name)
    |> UI.click(testid: UI.testid(["remove", ctx.admin.full_name]))
    |> UI.refute_text(ctx.admin.full_name)
  end

  step :add_trusted_email_domain, ctx, domain do
    ctx
    |> UI.fill(testid: "add-trusted-email-domain-input", with: domain)
    |> UI.click(testid: "add-trusted-email-domain-button")
    |> UI.assert_text(domain)
  end

  step :remove_trusted_email_domain, ctx, domain do
    ctx
    |> UI.click(testid: UI.testid(["remove-trusted-email-domain", domain]))
    |> UI.refute_text(domain, attempts: [50, 150, 250, 400])
  end

  step :edit_company_member, ctx, params do
    ctx
    |> UI.click(testid: UI.testid(["edit", Paths.person_id(ctx.member)]))
    |> UI.fill(testid: "name", with: params[:new_name])
    |> UI.fill(testid: "title", with: params[:new_title])
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "manage-people-page")
  end

  step :assert_company_member_details_updated, ctx, params do
    person = Operately.Repo.reload(ctx.member)

    assert person.full_name == params[:name]
    assert person.title == params[:title]

    ctx
  end

  step :assert_trusted_email_domain_added, ctx, domain do
    company = Operately.Companies.get_company!(ctx.company.id)
    assert company.trusted_email_domains == [domain]

    ctx
  end

  step :assert_truested_email_domain_list_empty, ctx do
    company = Operately.Companies.get_company!(ctx.company.id)
    assert company.trusted_email_domains == []

    ctx
  end

  step :assert_invitation_url_is_generated, ctx do
    ctx |> UI.assert_text("/join?token=")
  end

  step :assert_company_member_details_match_invitations, ctx, params do
    person = Operately.People.get_person_by_name!(ctx.company, params[:full_name])

    assert person != nil
    assert person.company_id == ctx.company.id
    assert person.full_name == "Michael Scott"
    assert person.title == "Regional Manager"

    ctx
  end

  step :assert_expiration_date_is_visible_on_team_page, ctx do
    ctx |> UI.assert_text("Expires in 24 hours")
  end

  step :given_the_company_has_trusted_email_domains, ctx, domains do
    {:ok, company} = Operately.Companies.update_company(ctx.company, %{trusted_email_domains: domains})
    assert company.trusted_email_domains == domains

    ctx
  end

  step :given_a_company_member_exists, ctx do
    Factory.add_company_member(ctx, :member, name: "Member Memberson")
  end

  step :given_a_company_admin_exists, ctx do
    Factory.add_company_admin(ctx, :admin, name: "Admin Adminson")
  end

  step :given_a_company_owner_exists, ctx do
    Factory.add_company_owner(ctx, :other_owner, name: "Other Ownerson")
  end

  step :click_on_add_remove_people, ctx do
    ctx |> UI.click(testid: "manage-team-members")
  end

  step :assert_company_member_is_listed, ctx do
    ctx |> UI.assert_text(ctx.member.full_name)
  end

  step :assert_new_company_member_is_listed, ctx, name do
    ctx |> UI.assert_text(name)
  end

  step :remove_company_member, ctx do
    ctx
    |> UI.click(testid: UI.testid(["person-options", Paths.person_id(ctx.member)]))
    |> UI.click(testid: UI.testid(["remove-person", Paths.person_id(ctx.member)]))
    |> UI.click(testid: UI.testid("confirm-remove-member"))
  end

  step :assert_member_removed, ctx do
    ctx |> UI.refute_text(ctx.member.full_name)

    person = Operately.Repo.reload(ctx.member)

    assert person != nil
    assert person.suspended
    assert person.suspended_at != nil

    ctx
  end

  step :assert_person_is_admin, ctx do
    admins = Operately.Companies.list_admins(ctx.company)

    assert Enum.any?(admins, fn admin -> admin.id == ctx.member.id end)

    ctx
  end

  step :refute_person_is_admin, ctx do
    admins = Operately.Companies.list_admins(ctx.company)

    refute Enum.any?(admins, fn admin -> admin.id == ctx.admin.id end)

    ctx
  end

  step :when_i_open_the_company_admin_page, ctx do
    ctx |> UI.visit(Paths.company_admin_path(ctx.company))
  end

  step :assert_i_see_reach_out_to_admins, ctx do
    UI.assert_text(ctx, "Reach out to an admin if you need to:")
  end

  step :assert_i_see_reach_out_to_owners, ctx do
    UI.assert_text(ctx, "Reach out to an account owner if you need to:")
  end

  step :assert_i_dont_see_reach_out_to_admins, ctx do
    UI.refute_text(ctx, "Reach out to an admin if you need to:")
  end

  step :assert_i_dont_see_reach_out_to_owners, ctx do
    UI.refute_text(ctx, "Reach out to an admin if you need to:")
  end

  step :click_rename_company, ctx do
    ctx |> UI.click(testid: "rename-the-company")
  end

  step :fill_in_new_company_name_and_submit, ctx do
    ctx
    |> UI.fill(testid: "name", with: "Dunder")
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "company-admin-page")
  end

  step :assert_company_name_is_changed_in_navbar, ctx do
    UI.find(ctx, UI.query(testid: "company-dropdown"), fn el ->
      UI.assert_text(el, "Dunder")
    end)
  end

  step :assert_company_name_is_changed, ctx do
    company = Operately.Companies.get_company!(ctx.company.id)

    assert company.name == "Dunder"

    ctx
  end

  step :assert_company_feed_shows_the_company_name_change, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.admin, "renamed the company to Dunder")
  end

  step :add_company_owner, ctx do
    ctx
    |> UI.click(testid: "add-owners")
    |> UI.fill(Query.css("#people-search"), with: String.slice(ctx.member.full_name, 0, 4))
    |> UI.assert_text(ctx.member.full_name)
    |> UI.send_keys([:enter])
    |> UI.click(testid: "save-owners")
    |> UI.sleep(500)
  end

  step :assert_person_is_owner, ctx do
    owners = Operately.Companies.list_owners(ctx.company)

    assert Enum.any?(owners, fn o -> o.id == ctx.member.id end)

    ctx
  end

  step :remove_company_owner, ctx do
    ctx
    |> UI.assert_text(ctx.other_owner.full_name)
    |> UI.click(testid: UI.testid(["remove", ctx.other_owner.full_name]))
    |> UI.refute_text(ctx.other_owner.full_name)
  end

  step :refute_person_is_owner, ctx do
    people = Operately.Repo.preload(ctx.company, :people).people
    owners = Operately.Companies.list_owners(ctx.company)

    refute Enum.find(people, fn p -> p.id == ctx.other_owner.id end).suspended
    assert Enum.any?(people, fn p -> p.id == ctx.other_owner.id end)
    refute Enum.any?(owners, fn admin -> admin.id == ctx.other_owner.id end)

    ctx
  end

  step :assert_notification_and_email_sent_to_removed_owner, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.company.name,
      to: ctx.other_owner,
      author: ctx.owner,
      action: "has revoked your account owner status"
    })
    |> Factory.log_in_person(:other_owner)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.owner,
      action: "Revoked your account owner status"
    })
  end

  step :assert_notification_and_email_sent_to_new_owner, ctx do
    ctx
    |> Factory.log_in_person(:member)
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.company.name,
      to: ctx.member,
      author: ctx.owner,
      action: "promoted you to an account owner"
    })
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.owner,
      action: "Promoted you to an account owner"
    })
  end

  step :assert_feed_item_for_removed_owner, ctx do
    name = Person.first_name(ctx.other_owner)

    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.owner, "removed #{name} as an account owner")
  end

  step :assert_feed_item_for_new_owner, ctx do
    name = Person.short_name(ctx.member)

    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.owner, "promoted #{name} to account owner")
  end

  step :given_a_removed_company_member_exists, ctx do
    ctx
    |> Factory.add_company_member(:suspended, name: "Suspended Memberson")
    |> Factory.suspend_company_member(:suspended)
  end

  step :open_restore_people_page, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.click(testid: "restore-access-for-deactivated-team-members")
    |> UI.assert_has(testid: "restore-suspended-people-page")
  end

  step :assert_removed_person_is_listed, ctx do
    ctx |> UI.assert_text(ctx.suspended.full_name)
  end

  step :restore_company_member, ctx do
    ctx |> UI.click(testid: UI.testid(["restore", Paths.person_id(ctx.suspended)]))
  end

  step :assert_member_restored, ctx do
    person = Operately.Repo.reload(ctx.suspended)
    assert person.suspended == false
    assert person.suspended_at == nil

    ctx
  end

  step :assert_feed_item_notification_and_email_sent_to_restored_member, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.admin, "restored #{Person.first_name(ctx.suspended)}'s account")
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.company.name,
      to: ctx.suspended,
      author: ctx.admin,
      action: "has restored your account"
    })
    |> Factory.log_in_person(:suspended)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.admin,
      action: "Restored your account"
    })
  end

  step :assert_no_suspended_people_message_is_displayed, ctx do
    ctx |> UI.assert_text("No deactivated team members")
  end

  step :revoke_member_invitation, ctx, name do
    person = Operately.People.get_person_by_name!(ctx.company, name)

    ctx
    |> UI.click(testid: UI.testid(["person-options", Paths.person_id(person)]))
    |> UI.click(testid: UI.testid(["remove-person", Paths.person_id(person)]))
    |> UI.assert_text("This will revoke #{Person.first_name(person)}'s invitation. You can create a new invitation later if needed.")
    |> UI.click(testid: UI.testid("confirm-remove-member"))
  end

  step :assert_invitation_revoked, ctx, params do
    ctx |> UI.refute_text(params.full_name)

    # Verify the person was completely deleted
    refute Operately.People.get_person_by_email(ctx.company, params.email)

    ctx
  end
end
