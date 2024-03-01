defmodule Operately.Features.ProjectMilestonesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectMilestoneSteps, as: Steps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Live support")
    ctx = UI.login_as(ctx, ctx.champion)

    {:ok, ctx}
  end

  feature "adding first milestones to a project", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("No milestones defined yet")
  #   |> UI.click(testid: "add-milestone")
  #   |> UI.fill(testid: "milestone-title", with: "Contract Signed")
  #   |> UI.click(testid: "milestone-due-date")
  #   |> UI.click(css: ".react-datepicker__day.react-datepicker__day--016")
  #   |> UI.click(testid: "save-milestone")
  end

  # feature "adding milestones to a project", ctx do
  #   ctx
  #   |> ProjectSteps.visit_project_page()
  #   |> UI.click(testid: "show-all-milestones")
  #   |> UI.click(testid: "add-milestone")
  #   |> UI.fill(testid: "milestone-title", with: "Contract Signed")
  #   |> UI.click(testid: "milestone-due-date")
  #   |> UI.click(css: ".react-datepicker__day.react-datepicker__day--016")
  #   |> UI.click(testid: "save-milestone")

  #   ctx
  #   |> UI.assert_text("Contract Signed")
  #   |> UI.assert_text(Person.short_name(ctx.champion) <> " added Contract Signed milestone")
  # end

  # feature "deleting a milestone on a project", ctx do
  #   add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

  #   ctx
  #   |> ProjectSteps.visit_project_page()
  #   |> UI.click(testid: "show-all-milestones")
  #   |> UI.click(testid: "delete-milestone")
  #   |> UI.assert_text(Person.short_name(ctx.champion) <> " deleted the Contract Signed milestone")
  # end

  # feature "see all milestones", ctx do
  #   add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})
  #   add_milestone(ctx, %{title: "Demo Day", deadline_at: ~N[2023-07-17 00:00:00]})
  #   add_milestone(ctx, %{title: "Website Launched", deadline_at: ~N[2023-07-17 00:00:00]})

  #   ctx
  #   |> ProjectSteps.visit_project_page()
  #   |> UI.find(testid: "timeline")
  #   |> UI.click(testid: "show-all-milestones")

  #   ctx
  #   |> UI.assert_text("Contract Signed", testid: "timeline")
  #   |> UI.assert_text("Demo Day", testid: "timeline")
  #   |> UI.assert_text("Website Launched", testid: "timeline")
  # end

  # feature "mark upcoming milestone completed", ctx do
  #   add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})
  #   add_milestone(ctx, %{title: "Website Launched", deadline_at: ~N[2023-07-17 00:00:00]})

  #   ctx
  #   |> ProjectSteps.visit_project_page()
  #   |> UI.find(@timeline_section, fn ctx ->
  #     ctx
  #     |> UI.assert_text("Contract Signed")
  #     |> UI.click_link("Contract Signed")
  #   end)
  #   |> UI.click(@complete_button)
  #   |> UI.assert_text("Milestone Completed")
  # end

  # feature "change milestone deadline", ctx do
  #   add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

  #   ctx
  #   |> ProjectSteps.visit_project_page()
  #   |> UI.click(testid: "show-all-milestones")
  #   |> UI.click(testid: "change-milestone-due-date")
  #   |> UI.click(css: ".react-datepicker__day.react-datepicker__day--016")
  #   |> UI.assert_text(Person.short_name(ctx.champion) <> " changed the due date for Contract Signed")
  # end

  # feature "change milestone deadline on the milestone page", ctx do
  #   {:ok, milestone} = add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

  #   ctx
  #   |> visit_page(ctx.project, milestone)
  #   |> UI.click(testid: "change-milestone-due-date")
  #   |> UI.click(css: ".react-datepicker__day.react-datepicker__day--016")

  #   ctx
  #   |> ProjectSteps.visit_project_page()
  #   |> UI.assert_text(Person.short_name(ctx.champion) <> " changed the due date for Contract Signed")
  # end

  # feature "visiting the milestone page", ctx do
  #   {:ok, milestone} = add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

  #   ctx
  #   |> ProjectSteps.visit_project_page()
  #   |> UI.find(testid: "timeline")
  #   |> UI.click(testid: "show-all-milestones")
  #   |> UI.click(testid: "milestone-link-#{milestone.id}")

  #   ctx
  #   |> UI.assert_page("/projects/#{ctx.project.id}/milestones/#{milestone.id}")
  #   |> UI.assert_text("Contract Signed")
  # end

  # feature "adding a description", ctx do
  #   {:ok, milestone} = add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

  #   ctx
  #   |> UI.visit("/projects/#{ctx.project.id}/milestones/#{milestone.id}")
  #   |> UI.click(testid: "write-milestone-description")
  #   |> UI.fill_rich_text(testid: "milestone-description-editor", with: "This is a description")
  #   |> UI.click(testid: "save-milestone-description")
  #   |> UI.assert_text("This is a description")
  # end

  # feature "editing the description", ctx do
  #   {:ok, milestone} = add_milestone(ctx, %{
  #     title: "Contract Signed", 
  #     deadline_at: ~N[2023-06-17 00:00:00],
  #     description: Operately.UpdatesFixtures.rich_text_fixture("This is a description")
  #   })

  #   ctx
  #   |> visit_page(ctx.project, milestone)
  #   |> UI.assert_text("This is a description")

  #   ctx
  #   |> UI.hover(testid: "milestone-description")
  #   |> UI.click(testid: "edit-milestone-description")

  #   ctx
  #   |> UI.fill_rich_text(testid: "milestone-description-editor", with: "This is a NEW description")
  #   |> UI.click(testid: "save-milestone-description")
  #   |> UI.assert_text("This is a NEW description")
  # end

  feature "write a comment on a milestones", ctx do
    ctx
    |> Steps.given_that_a_milestone_exists("Contract Signed")
    |> Steps.visit_milestone_page()
    |> Steps.leave_a_comment("Hello world")
    |> Steps.assert_comment_visible_in_project_feed("Hello world")
    |> Steps.assert_comment_email_sent_to_project_reviewer()
    |> Steps.assert_comment_notification_sent_to_project_reviewer()
  end

  # feature "write a comment and complete the milestone", ctx do
  #   {:ok, milestone} = add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

  #   ctx
  #   |> visit_page(ctx.project, milestone)
  #   |> UI.fill_rich_text(testid: "milestone-comment-editor", with: "This is a comment")
  #   |> UI.click(testid: "complete-and-comment")
  #   |> UI.assert_text("This is a comment")
  #   |> UI.assert_text("Milestone Completed")

  #   ctx
  #   |> UI.login_as(ctx.reviewer)
  #   |> NotificationsSteps.assert_milestone_completed_sent(author: ctx.champion, title: "Contract Signed")
  #   |> EmailSteps.assert_milestone_completed_sent(author: ctx.champion, to: ctx.reviewer, title: "Contract Signed")
  # end

  # feature "write a comment and re-open the milestone", ctx do
  #   {:ok, milestone} = add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00], completed_at: ~N[2023-06-17 00:00:00], status: :done})

  #   ctx
  #   |> visit_page(ctx.project, milestone)
  #   |> UI.fill_rich_text(testid: "milestone-comment-editor", with: "This is a comment")
  #   |> UI.click(testid: "reopen-and-comment")
  #   |> UI.assert_text("This is a comment")
  #   |> UI.assert_text("Milestone Re-Opened")

  #   ctx
  #   |> UI.login_as(ctx.reviewer)
  #   |> NotificationsSteps.assert_milestone_reopened_sent(author: ctx.champion, title: "Contract Signed")
  #   |> EmailSteps.assert_milestone_reopened_sent(author: ctx.champion, to: ctx.reviewer, title: "Contract Signed")
  # end

  # feature "rename a milestone", ctx do
  #   {:ok, milestone} = add_milestone(ctx, %{title: "Contract Signed", deadline_at: ~N[2023-06-17 00:00:00]})

  #   ctx
  #   |> visit_page(ctx.project, milestone)
  #   |> UI.click(testid: "edit-milestone-title")
  #   |> UI.fill(testid: "milestone-title-input", with: "Contract Signed 2")
  #   |> UI.click(testid: "save-milestone-title")
  #   |> UI.assert_text("Contract Signed 2")
  # end
end
