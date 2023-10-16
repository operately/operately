defmodule Operately.Features.ProjectDiscussionsText do
  use Operately.Feature

  alias Operately.Support.Features.ProjectSteps

  @new_discussion_button UI.query(testid: "new-discussion-button")
  @discussion_title_input UI.query(testid: "discussion-title-input")
  @submit_discussion_button UI.query(testid: "submit-discussion-button")
  
  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, state}
  end

  @tag login_as: :champion
  feature "start a new discussion", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(@new_discussion_button)
    |> UI.fill(@discussion_title_input, with: "How are we going to do this?")
    |> UI.fill_rich_text("I think we should do it like this... I would like to hear your thoughts.")
    |> UI.click(@submit_discussion_button)
    |> UI.assert_text("How are we going to do this?")
    |> UI.assert_text("I think we should do it like this... I would like to hear your thoughts.")
  end
end
