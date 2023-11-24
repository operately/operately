defmodule Operately.Features.ProjectResourcesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
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
    |> fill_rich_text_in("what-could-be-better", "We built the thing")
    |> fill_rich_text_in("what-we-learned", "We learned the thing")
    |> UI.click(testid: "submit-retrospective-button")

    ctx
    |> UI.login_as(ctx.reviwer)
    |> NotificationsSteps.assert_project_retrospective_sent(author: ctx.champion, to: ctx.reviewer)
    |> EmailSteps.assert_project_retrospective_sent(author: ctx.champion, to: ctx.reviewer)
  end

  #
  # Helpers
  #

  defp add_milestone(ctx, name, status) do
    changeset = Operately.Projects.Milestone.changeset(%{
      title: name,
      deadline_at: NaiveDateTime.utc_now(),
      status: status
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
