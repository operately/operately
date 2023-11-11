defmodule Operately.Features.ProjectDiscussionsText do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.People.Person
  
  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  # @tag login_as: :champion
  # feature "start a new discussion", ctx do
  #   title = "How are we going to do this?"
  #   body = "I think we should do it like this... I would like to hear your thoughts."

  #   ctx
  #   |> ProjectSteps.post_new_discussion(title: title, body: body)
  #   |> ProjectSteps.visit_project_page()
  #   |> ProjectSteps.assert_discussion_exists(title: title)

  #   ctx
  #   |> UI.login_as(ctx.reviewer)
  #   |> NotificationsSteps.assert_project_update_submitted_sent(author: ctx.champion, title: title)

  #   ctx
  #   |> ProjectSteps.assert_email_sent_to_all_contributors(
  #     subject: "#{Person.short_name(ctx.champion)} started a discussion in #{ctx.project.name}: How are we going to do this?",
  #     except: [ctx.champion.email]
  #   )
  # end

  # @tag login_as: :champion
  # feature "comment on a discussion", ctx do
  #   title = "How are we going to do this?"
  #   body = "I think we should do it like this... I would like to hear your thoughts."
  #   comment = "Sounds good to me! Let's do it!"

  #   ctx
  #   |> ProjectSteps.post_new_discussion(title: title, body: body)
  #   |> ProjectSteps.visit_project_page()
  #   |> ProjectSteps.click_on_discussion(title: title)
  #   |> ProjectSteps.post_comment(body: comment)
  #   |> UI.assert_text(comment)

  #   ctx
  #   |> UI.login_as(ctx.reviewer)
  #   |> NotificationsSteps.assert_discussion_commented_sent(author: ctx.champion, title: title)

  #   ctx
  #   |> ProjectSteps.assert_email_sent_to_all_contributors(
  #     subject: "#{Person.short_name(ctx.champion)} commented on: #{title}",
  #     except: [ctx.champion.email]
  #   )
  # end

end
