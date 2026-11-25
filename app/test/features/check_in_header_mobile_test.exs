defmodule Operately.Features.CheckInHeaderMobileTest do
  use Operately.FeatureCase

  alias Operately.Access.Binding

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, company_access_level: Binding.view_access())
    |> Factory.add_project_check_in(:project_check_in, :project, :creator)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_goal_update(:goal_check_in, :goal, :creator)
    |> Factory.add_company_member(:viewer)
    |> Factory.log_in_person(:creator)
  end

  feature "goal and project menus work at 320px and read-only check-ins have no menu", ctx do
    ctx = Map.update!(ctx, :session, &Wallaby.Browser.resize_window(&1, 320, 800))

    ctx
    |> UI.visit(Paths.project_check_in_path(ctx.company, ctx.project_check_in))
    |> UI.assert_has(testid: "project-check-in-page")
    |> UI.assert_has(css: "h1")
    |> UI.click(testid: "options-button")
    |> UI.assert_has(testid: "edit-check-in")
    |> UI.click(testid: "project-options-button")
    |> UI.refute_has(testid: "edit-check-in")
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-check-in")
    |> UI.assert_has(testid: "project-check-in-edit-page")
    |> UI.visit(Paths.goal_check_in_path(ctx.company, ctx.goal_check_in))
    |> UI.assert_has(testid: "goal-check-in-page")
    |> UI.assert_has(css: "h1")
    |> UI.click(testid: "check-in-options")
    |> UI.assert_has(testid: "edit-check-in")
    |> UI.click(testid: "project-options-button")
    |> UI.refute_has(testid: "edit-check-in")
    |> UI.click(testid: "check-in-options")
    |> UI.click(testid: "edit-check-in")
    |> UI.refute_has(testid: "check-in-options")

    ctx = UI.login_as(ctx, ctx.viewer)

    ctx
    |> UI.visit(Paths.project_check_in_path(ctx.company, ctx.project_check_in))
    |> UI.assert_has(testid: "project-check-in-page")
    |> UI.assert_has(css: "h1")
    |> UI.refute_has(testid: "options-button")
    |> UI.visit(Paths.goal_check_in_path(ctx.company, ctx.goal_check_in))
    |> UI.assert_has(testid: "goal-check-in-page")
    |> UI.assert_has(css: "h1")
    |> UI.refute_has(testid: "check-in-options")
  end
end
