defmodule Operately.Features.ProjectRetrospectivesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "closing a project with all milestones completed", ctx do
    ctx
    |> add_milestone("Build a thing", :done)
    |> add_milestone("Launch the thing", :done)

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "close-project-button")
    |> fill_rich_text_in("what-went-well", "We built the thing")
    |> fill_rich_text_in("what-could-ve-gone-better", "We built the thing")
    |> fill_rich_text_in("what-did-you-learn", "We learned the thing")
    |> UI.click(testid: "submit")

    ctx
    |> FeedSteps.assert_project_retrospective_posted(author: ctx.champion)
    |> UI.assert_text("This project was closed on")
    |> UI.click(testid: "project-retrospective-link")
    |> UI.assert_text(ctx.champion.full_name)
    |> UI.assert_text("We built the thing")
    |> UI.assert_text("We learned the thing")
    |> UI.assert_text("We built the thing")
    |> UI.refute_has(testid: "close-project-button")

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer, 
      author: ctx.champion, 
      action: "closed the project and submitted a retrospective"
    })

    email = UI.list_sent_emails(ctx) |> List.last()
    assert email.html_body =~ "We built the thing"
    assert email.html_body =~ "We learned the thing"
    assert email.html_body =~ "We built the thing"

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_retrospective_sent(author: ctx.champion)
  end

  @tag login_as: :champion
  feature "can't close a project with an emtpy retrospective", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "close-project-button")
    |> UI.click(testid: "submit")
    |> UI.assert_text("Please fill in this field")
  end

  #
  # Helpers
  #

  defp add_milestone(ctx, name, status) do
    changeset = Operately.Projects.Milestone.changeset(%{
      title: name,
      deadline_at: NaiveDateTime.utc_now(),
      status: status,
      project_id: ctx.project.id
    })

    {:ok, _} = Operately.Repo.insert(changeset)

    ctx
  end

  defp fill_rich_text_in(ctx, testid, content) do
    ctx
    |> UI.find(UI.query(testid: testid), fn el ->
      UI.fill_rich_text(el, content)
    end)
  end

end
