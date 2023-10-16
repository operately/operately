defmodule Operately.Support.Features.ProjectSteps do
  alias Operately.FeatureCase.UI

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  def create_project(ctx, name: name) do
    company = company_fixture(%{name: "Test Org"})
    champion = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})

    params = %Operately.Projects.ProjectCreation{
      company_id: company.id,
      name: name,
      champion_id: champion.id,
      creator_id: champion.id,
      creator_role: nil,
      visibility: "everyone",
    }

    {:ok, project} = Operately.Projects.create_project(params)

    {:ok, _} = Operately.Projects.create_contributor(%{
      person_id: reviewer.id,
      role: :reviewer,
      project_id: project.id,
      responsibility: " "
    })

    Map.merge(ctx, %{company: company, champion: champion, project: project, reviewer: reviewer})
  end

  def login(ctx) do
    case ctx[:login_as] do
      :champion ->
        UI.login_as(ctx, ctx.champion)
      :reviewer ->
        UI.login_as(ctx, ctx.reviewer)
      _ ->
        ctx
    end
  end

  def visit_project_page(ctx) do
    ctx |> UI.visit("/projects/#{ctx.project.id}")
  end
end
