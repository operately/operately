defmodule Operately.Support.Features.ProjectDiscussionSteps do
  use Operately.FeatureCase

  # alias Operately.Support.Features.ProjectSteps
  # alias Operately.Support.Features.FeedSteps
  # alias Operately.Support.Features.NotificationsSteps
  # alias Operately.Support.Features.EmailSteps

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_discussions")
    |> Factory.add_space(:marketing)
    |> Factory.add_project(:project, :marketing)
    |> Factory.log_in_person(:creator)
  end

  step :given_several_discussions_exist, ctx do
    ctx
    |> Factory.add_project_discussion(:discussion1, :project, title: "Discussion 1", content: "Content for discussion 1")
    |> Factory.add_project_discussion(:discussion2, :project, title: "Discussion 2", content: "Content for discussion 2")
    |> Factory.add_project_discussion(:discussion3, :project, title: "Discussion 3", content: "Content for discussion 3")
  end

  step :visit_project_page, ctx do
    ctx |> UI.visit(OperatelyWeb.Paths.project_path(ctx.company, ctx.project))
  end

  step :assert_discussion_listed, ctx do
    ctx
    |> UI.assert_text("Discussion 1")
    |> UI.assert_text("Discussion 2")
    |> UI.assert_text("Discussion 3")
  end
end
