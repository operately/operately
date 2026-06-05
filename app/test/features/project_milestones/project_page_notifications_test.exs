defmodule Operately.Features.ProjectMilestones.ProjectPageNotificationsTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectMilestonesCase

  feature "creator is automatically subscribed to milestone", ctx do
    name = "New Milestone"

    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.add_milestone(name: name)
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: name)
    |> then(fn ctx ->
      milestone = Operately.Repo.get_by(Operately.Projects.Milestone, title: name)
      Map.put(ctx, :milestone, milestone)
    end)
    |> Steps.visit_milestone_page()
    |> Steps.assert_milestone_subscription_created()
  end

  feature "champion is automatically subscribed to milestone", ctx do
    name = "Champion Milestone"

    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.add_milestone(name: name)
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: name)

    ctx
    |> then(fn ctx ->
      milestone = Operately.Repo.get_by(Operately.Projects.Milestone, title: name)
      Map.put(ctx, :milestone, milestone)
    end)
    |> UI.login_as(ctx.champion)
    |> Steps.visit_milestone_page()
    |> Steps.assert_milestone_subscription_created()
  end

  feature "add milestone sends notification and email to champion", ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> Steps.visit_project_page()
    |> Steps.add_milestone(name: "New milestone")
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "New milestone")
    |> then(fn ctx ->
      milestone = Operately.Repo.get_by(Operately.Projects.Milestone, title: "New milestone")
      Map.put(ctx, :milestone, milestone)
    end)
    |> Steps.assert_milestone_creation_notification_sent()
    |> Steps.assert_milestone_creation_email_sent()
    |> Steps.assert_milestone_creation_visible_in_feed()
  end

  feature "create and delete milestone, verify notifications and feed still work", ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> Steps.visit_project_page()
    |> Steps.add_milestone(name: "Temporary milestone")
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "Temporary milestone")
    |> then(fn ctx ->
      milestone = Operately.Repo.get_by(Operately.Projects.Milestone, title: "Temporary milestone")
      Map.put(ctx, :milestone, milestone)
    end)
    |> Steps.visit_milestone_page()
    |> Steps.delete_milestone()
    |> Steps.assert_redirected_to_project_page()
    |> Steps.assert_milestone_deleted()
    |> Steps.assert_milestone_creation_notification_sent()
    |> Steps.assert_milestone_creation_email_sent()
    |> Steps.assert_milestone_creation_visible_in_feed()
  end
end
