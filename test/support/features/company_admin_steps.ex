defmodule Operately.Support.Features.CompanyAdminSteps do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  step :given_a_company_exists, ctx do
    company = company_fixture(%{name: "Dunder Mifflin"})
    owner = Operately.Companies.list_owners(company) |> List.first()

    ctx
    |> Map.put(:company, company)
    |> Map.put(:owner, owner)
  end

  step :given_i_am_logged_in, ctx, [as: role] do
    cond do
      role == :admin ->
        admin = person_fixture_with_account(%{full_name: "Admin Adminson", company_id: ctx.company.id})
        {:ok, _} = Operately.Companies.add_admins(ctx.owner, admin.id)
        UI.login_as(ctx, admin)

      role == :owner ->
        owner = person_fixture_with_account(%{full_name: "Owner Ownerson", company_id: ctx.company.id})
        {:ok, _} = Operately.Companies.add_owner(ctx.owner, owner.id)
        UI.login_as(ctx, owner)

      role == :member ->
        owner = person_fixture_with_account(%{full_name: "Member Memberson", company_id: ctx.company.id})
        UI.login_as(ctx, owner)
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
    |> UI.fill(testid: "person-full-name", with: params[:full_name])
    |> UI.fill(testid: "person-email", with: params[:email])
    |> UI.fill(testid: "person-title", with: params[:title])
    |> UI.click(testid: "submit")
  end

  step :add_company_admin, ctx, name do
    ctx
    |> UI.click(testid: "add-admins")
    |> UI.fill_in(Query.css("#people-search"), with: String.slice(name, 0, 4))
    |> UI.assert_text(name)
    |> UI.send_keys([:enter])
    |> UI.click(testid: "save-admins")
    |> UI.sleep(500)
  end

  step :remove_company_admin, ctx, name do
    ctx
    |> UI.assert_text(name)
    |> UI.click(testid: UI.testid(["remove", name]))
    |> UI.refute_text(name, attempts: [50, 150, 250, 400])
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
    person = Operately.People.get_person_by_name!(ctx.company, params[:name])

    ctx
    |> UI.click(testid: UI.testid(["edit", Paths.person_id(person)]))
    |> UI.fill(testid: "name", with: params[:new_name])
    |> UI.fill(testid: "title", with: params[:new_title])
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "manage-people-page")
  end

  step :assert_company_member_details_updated, ctx, params do
    person = Operately.People.get_person_by_name!(ctx.company, params[:name])

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

  step :given_a_company_member_exists, ctx, name do
    person_fixture(%{full_name: name, company_id: ctx.company.id})
    ctx
  end

  step :given_a_company_admin_exists, ctx, name do
    Factory.add_company_admin(ctx, :admin, [name: name])
  end

  step :click_on_add_remove_people, ctx do
    ctx |> UI.click(testid: "manage-team-members")
  end

  step :assert_company_member_is_listed, ctx, name do
    ctx |> UI.assert_text(name)
  end

  step :remove_company_member, ctx, name do
    person = Operately.People.get_person_by_name!(ctx.company, name)

    ctx
    |> UI.click(testid: UI.testid(["person-options", Paths.person_id(person)]))
    |> UI.click(testid: UI.testid(["remove-person", Paths.person_id(person)]))
    |> UI.click(testid: UI.testid("confirm-remove-member"))
  end

  step :assert_member_removed, ctx, name do
    ctx |> UI.refute_text(name, attempts: [50, 150, 250, 400])

    person = Operately.People.get_person_by_name!(ctx.company, "Dwight Schrute")
    assert person != nil
    assert person.suspended
    assert person.suspended_at != nil

    ctx
  end

  step :assert_person_is_admin, ctx, name do
    person = Operately.People.get_person_by_name!(ctx.company, name)
    admins = Operately.Companies.list_admins(ctx.company)

    assert Enum.any?(admins, fn admin -> admin.id == person.id end)

    ctx
  end

  step :refute_person_is_admin, ctx, name do
    person = Operately.People.get_person_by_name!(ctx.company, name)
    admins = Operately.Companies.list_admins(ctx.company)

    refute Enum.any?(admins, fn admin -> admin.id == person.id end)

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
    |> UI.take_screenshot()
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
    |> UI.assert_feed_item(ctx.owner, "renamed the company to Dunder")
  end

end
