defmodule Operately.Support.Features.ProjectRetrospectiveAcknowledgementSteps do
  use Operately.FeatureCase

  alias Operately.Support.Factory
  alias Operately.Support.Features.{EmailSteps, NotificationsSteps, FeedSteps}

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_project(:project, :space, champion: :champion, reviewer: :reviewer, name: "Test Project")
    |> then(fn ctx -> UI.login_as(ctx, ctx.champion) end)
  end

  step :close_project_as_champion, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.find(UI.query(testid: "actions-section"), fn el ->
      UI.click_text(el, "Close project")
    end)
    |> fill_rich_text("retrospective-notes", "We built the thing")
    |> UI.click(testid: "submit")
    |> UI.sleep(300)
  end

  step :acknowledge_retrospective_as_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.project_retrospective_path(ctx.company, ctx.project))
    |> UI.click(testid: "acknowledge-retrospective")
    |> UI.sleep(300)
  end

  step :assert_retrospective_acknowledged, ctx do
    ctx
    |> UI.assert_text("Acknowledged by")
    |> UI.assert_text("#{ctx.reviewer.full_name} acknowledged this Retrospective")
  end

  step :assert_acknowledgement_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      action: "acknowledged your retrospective",
      author: ctx.reviewer
    })
  end

  step :assert_acknowledgement_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "Acknowledged retrospective"
    })
  end

  step :assert_acknowledgement_visible_on_feed, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.reviewer,
      title: "acknowledged the retrospective"
    })
  end

  step :acknowledge_retrospective_from_email, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "closed the project and submitted a retrospective",
      author: ctx.champion
    })

    email = UI.Emails.last_sent_email(to: ctx.reviewer.email)
    path = UI.Emails.find_link(email, "Acknowledge")

    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(path)
    |> UI.sleep(500)
  end

  defp fill_rich_text(ctx, testid, content) do
    ctx
    |> UI.find(UI.query(testid: testid), fn el ->
      UI.fill_rich_text(el, content)
    end)
  end
end
