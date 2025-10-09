defmodule Operately.Support.Features.CompaniesSteps do
  use Operately.FeatureCase

  alias Operately.{Companies, Repo}
  alias Operately.Groups.Group
  alias Operately.Support.Features.UI
  alias Wallaby.{Browser, Element}

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  step :given_a_user_is_logged_in_that_belongs_to_a_company, ctx do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture_with_account(%{full_name: "Kevin Kernel", company_id: company.id})

    ctx = Map.merge(ctx, %{company: company, person: person})
    ctx = UI.login_as(ctx, ctx.person)

    ctx
  end

  step :navigate_to_the_loby, ctx do
    ctx |> UI.visit("/")
  end

  step :click_on_the_add_company_button, ctx do
    ctx |> UI.click(testid: "add-company-card")
  end

  step :fill_in_company_form_and_submit, ctx do
    ctx
    |> UI.fill(testid: "companyname", with: "Acme Co.")
    |> UI.fill(testid: "title", with: "System Administrator")
    |> UI.click(testid: "submit")
    |> UI.assert_text("Acme Co.")
  end

  step :assert_welcome_from_marko_is_shown, ctx do
    ctx
    |> UI.assert_has(testid: "company-creator-onboarding")
    |> UI.assert_has(testid: "company-creator-step-welcome")
    |> UI.assert_text("Thanks for joining Operately!")
  end

  step :click_lets_start, ctx do
    ctx |> UI.click(testid: "company-creator-lets-start")
  end

  step :select_a_few_spaces_to_create, ctx do
    ctx
    |> UI.assert_has(testid: "company-creator-step-spaces")
    |> UI.click(testid: "company-creator-space-marketing")
    |> UI.click(testid: "company-creator-space-engineering")
    |> UI.click(testid: "company-creator-next")
    |> Map.put(:selected_spaces, ["Marketing", "Engineering"])
  end

  step :assert_i_get_an_invitation_token, ctx do
    ctx = ctx |> UI.assert_has(testid: "company-creator-step-invite")

    element = Browser.find(ctx.session, UI.query(testid: "company-creator-invite-link"))
    value = Element.attr(element, "value")

    assert is_binary(value)
    assert String.contains?(value, "/join")

    Map.put(ctx, :invitation_link, value)
  end

  step :complete_onboarding, ctx do
    ctx
    |> UI.click(testid: "company-creator-finish")
    |> UI.sleep(1000)
    |> UI.refute_has(testid: "company-creator-onboarding")
  end

  step :assert_spaces_are_created, ctx do
    # assert created in DB
    Enum.map(ctx.selected_spaces, fn space ->
      group = Repo.get_by(Group, name: space, company_id: ctx.company.id)
      assert group, "Expected space \"#{space}\" to be created"
    end)

    # assert visible on page
    Enum.map(ctx.selected_spaces, fn space ->
      UI.assert_text(ctx, space)
    end)

    ctx
  end

  step :assert_company_is_created, ctx do
    company = Companies.get_company_by_name("Acme Co.")
    assert company != nil

    target_account_id =
      cond do
        match?(%{person: %{account_id: _}}, ctx) and ctx.person -> ctx.person.account_id
        Map.has_key?(ctx, :account) -> ctx.account.id
        true -> flunk("Missing account context for company creator")
      end

    person =
      company
      |> Ecto.assoc(:people)
      |> Repo.all()
      |> Enum.find(fn person -> person.account_id == target_account_id end)

    assert person != nil
    assert person.title == "System Administrator"

    ctx
    |> Map.put(:company, company)
    |> Map.put(:person, person)
  end

  step :assert_feed_displays_company_creation, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.person, "created this company")
  end
end
