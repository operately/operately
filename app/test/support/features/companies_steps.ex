defmodule Operately.Support.Features.CompaniesSteps do
  use Operately.FeatureCase

  alias Operately.{Billing, Companies, Repo}
  alias Operately.Projects.Project
  alias Operately.Support.Features.UI
  alias OperatelyWeb.Paths

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  step :given_a_user_is_logged_in_that_belongs_to_a_company, ctx do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture_with_account(%{full_name: "Kevin Kernel", company_id: company.id})

    ctx = Map.merge(ctx, %{company: company, person: person})
    ctx = UI.login_as(ctx, ctx.person)

    ctx
  end

  step :seed_active_billing_catalog, ctx do
    create_active_product("prod_pro_monthly", "team", "monthly")

    ctx
  end

  step :navigate_to_the_loby, ctx do
    ctx |> UI.visit("/")
  end

  step :navigate_to_new_company_page_with_billing_intent, ctx do
    ctx |> UI.visit("/new?plan=team&billing_period=monthly")
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

  step :assert_first_project_setup_is_shown, ctx do
    ctx
    |> UI.assert_page(Paths.work_map_path(ctx.company))
    |> UI.refute_has(testid: "company-creator-onboarding")
    |> UI.assert_has(testid: "first-project-zero-state")
    |> UI.assert_text("Add your first project")
  end

  step :create_first_project, ctx do
    project_name = "Launch customer portal"

    ctx =
      ctx
      |> UI.fill(testid: "first-project-name", with: project_name)
      |> UI.click(testid: "create-first-project")
      |> UI.wait_until_has(testid: "project-page")

    project = Repo.get_by!(Project, company_id: ctx.company.id, name: project_name)
    Map.put(ctx, :first_project, project)
  end

  step :assert_first_project_defaults, ctx do
    project = Repo.preload(ctx.first_project, [:group, contributors: :person])
    champion = Enum.find(project.contributors, &(&1.role == :champion))
    company_spaces = Repo.all(Ecto.assoc(ctx.company, :spaces))
    company = Repo.reload(ctx.company)

    assert project.group.name == "General"
    assert champion.person_id == ctx.person.id
    assert Enum.map(company_spaces, & &1.name) == ["General"]
    assert company.setup_completed

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

  step :assert_billing_intent_is_saved, ctx do
    billing_account = Billing.get_billing_account_by_company(ctx.company)

    assert billing_account != nil
    assert billing_account.suggested_plan_key == "team"
    assert billing_account.suggested_billing_interval == :monthly
    assert billing_account.suggested_plan_source == "website"
    assert billing_account.status == :free
    assert billing_account.plan_key == nil

    ctx
  end

  defp create_active_product(polar_product_id, plan_family, billing_interval) do
    {:ok, product} =
      Billing.create_product(%{
        provider: "polar",
        plan_family: plan_family,
        billing_interval: billing_interval,
        polar_product_id: polar_product_id
      })

    {:ok, product} = Billing.set_active_product(product)
    product
  end
end
