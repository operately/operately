defmodule Operately.Support.Features.CuratedTemplateCreationSteps do
  use Operately.FeatureCase

  step :visit_template, ctx do
    UI.visit(ctx, entry_path(ctx))
  end

  step :assert_setup_without_creation, ctx do
    ctx = UI.assert_has(ctx, testid: "curated-template-use-page")
    assert resource_count() == 0
    ctx
  end

  step :create_resource, ctx, type do
    ctx = UI.click(ctx, testid: "submit")

    testid =
      case type do
        :goal -> "goal-page"
        :project -> "project-page"
        :kpi -> "space-kpis-page"
      end

    ctx = UI.assert_has(ctx, testid: testid)
    assert resource_count() == 1
    ctx
  end

  step :choose_company, ctx do
    UI.click(ctx, css: "a[href='/#{Paths.company_id(ctx.company)}#{entry_path(ctx)}']")
  end

  step :password_login, ctx do
    ctx
    |> UI.fill(testid: "email", with: ctx.account.email)
    |> UI.fill(testid: "password", with: Operately.PeopleFixtures.valid_account_password())
    |> UI.click(testid: "submit")
  end

  step :create_company, ctx do
    ctx
    |> UI.fill(testid: "companyname", with: "New template company")
    |> UI.fill(testid: "title", with: "Founder")
    |> UI.click(testid: "submit")
  end

  step :assert_google_handoff, ctx do
    path = "/accounts/auth/google?" <> URI.encode_query(%{redirect_to: entry_path(ctx)})
    UI.assert_has(ctx, css: "a[href='#{path}']")
  end

  step :complete_google_login, ctx do
    path = "/accounts/auth/test_google?" <> URI.encode_query(%{account_id: ctx.account.id, redirect_to: entry_path(ctx)})
    UI.visit(ctx, path)
  end

  defp resource_count do
    [Operately.Goals.Goal, Operately.Projects.Project, Operately.Kpis.Kpi]
    |> Enum.map(&Repo.aggregate(&1, :count))
    |> Enum.sum()
  end

  defp entry_path(ctx), do: "/templates/#{Paths.curated_template_id(ctx.template)}/use"
end
