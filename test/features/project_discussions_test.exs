defmodule Operately.Features.ProjectDiscussionsText do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.People.Person
  
  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "start a new discussion", ctx do
    ctx
    |> ProjectSteps.post_new_discussion(
      title: "How are we going to do this?", 
      body: "I think we should do it like this... I would like to hear your thoughts."
    )

    ctx
    |> ProjectSteps.visit_project_page()
    |> ProjectSteps.assert_discussion_exists(title: "How are we going to do this?")

    ctx
    |> ProjectSteps.assert_email_sent_to_all_contributors(
      subject: "#{Person.short_name(ctx.champion)} started a discussion in #{ctx.project.name}: How are we going to do this?",
      except: [ctx.champion.email]
    )
  end

  @tag login_as: :champion
  feature "comment on a discussion", ctx do
    ctx
    |> ProjectSteps.post_new_discussion(
      title: "How are we going to do this", 
      body: "I think we should do it like this... I would like to hear your thoughts."
    )
    
    ctx
    |> UI.login_as(ctx.reviewer)
    |> ProjectSteps.visit_project_page()
    |> ProjectSteps.click_on_discussion(title: "How are we going to do this")
    |> ProjectSteps.post_comment(body: "Sounds good to me! Let's do it!")
    |> UI.assert_text("Sounds good to me! Let's do it!")

    ctx
    |> ProjectSteps.assert_email_sent_to_all_contributors(
      subject: "New comment on discussion in #{ctx.project.name}: How are we going to do this?",
      except: [ctx.reviewer.email]
    )
  end

end
