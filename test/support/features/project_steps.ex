defmodule Operately.Support.Features.ProjectSteps do
  alias Operately.FeatureCase.UI

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  def create_project(ctx, name: name) do
    company = company_fixture(%{name: "Test Org"})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})

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

  def post_new_discussion(ctx, title: title, body: body) do
    ctx
    |> visit_project_page()
    |> UI.click(testid: "new-discussion-button")
    |> UI.fill(testid: "discussion-title-input", with: title)
    |> UI.fill_rich_text(body)
    |> UI.click(testid: "submit-discussion-button")
  end

  def post_comment(ctx, body: body) do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(body)
    |> UI.click(testid: "post-comment")
  end

  def click_on_discussion(ctx, title: title) do
    ctx |> UI.click(title: title)
  end

  def submit_status_update(ctx, content: content) do
    ctx
    |> visit_project_page()
    |> UI.click(testid: "add-status-update")
    |> UI.fill_rich_text(content)
    |> UI.click(testid: "post-status-update")
  end

  # 
  # Navigation between project pages
  #

  def visit_project_page(ctx) do
    ctx |> UI.visit("/projects/#{ctx.project.id}")
  end

  #
  # Assertions
  #

  def assert_email_sent_to_all_contributors(ctx, subject: subject, except: except) do
    contributors = Operately.Projects.list_project_contributors(ctx.project)

    Enum.each(contributors, fn contributor ->
      email = Operately.People.get_person!(contributor.person_id).email

      unless Enum.member?(except, email) do
        UI.assert_email_sent(ctx, subject, to: email)
      end
    end)

    Enum.each(except, fn email ->
      UI.refute_email_sent(ctx, subject, to: email)
    end)
  end

  def assert_discussion_exists(ctx, title: title) do
    ctx |> UI.assert_text(title)
  end
end
