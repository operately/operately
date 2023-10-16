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

  def assert_email_sent_to_all_contributors(ctx, subject: subject) do
    contributors = Operately.Projects.list_project_contributors(ctx.project.id)

    Enum.map(contributors, fn contributor ->
      email = Operately.People.get_person!(contributor.person_id).email

      UI.assert_email_sent(ctx, subject, to: email)
    end)
  end

  @new_discussion_button UI.query(testid: "new-discussion-button")
  @discussion_title_input UI.query(testid: "discussion-title-input")
  @submit_discussion_button UI.query(testid: "submit-discussion-button")

  def post_new_discussion(ctx, title: title, body: body) do
    ctx
    |> visit_project_page()
    |> UI.click(@new_discussion_button)
    |> UI.fill(@discussion_title_input, with: title)
    |> UI.fill_rich_text(body)
    |> UI.click(@submit_discussion_button)
  end

  def post_comment(ctx, body: body) do
    ctx
    |> UI.fill_rich_text(body)
    |> UI.click(UI.query(testid: "submit-comment-button"))
  end

  def assert_discussion_exists(ctx, title: title) do
    ctx |> UI.assert_text(title)
  end
end
