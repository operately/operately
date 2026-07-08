defmodule Operately.Support.Features.GoalClosingSteps do
  use Operately.FeatureCase

  alias Operately.Support.{Factory, RichText}
  alias Operately.Support.Features.UI

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product)
    |> Factory.add_space_member(:champion, :product)
    |> Factory.add_space_member(:reviewer, :product)
    |> Factory.add_goal(:goal, :product, champion: :champion, reviewer: :reviewer, name: "Main Goal")
    |> then(fn ctx -> UI.login_as(ctx, ctx.creator) end)
  end

  step :given_goal_with_projects_exists, ctx do
    ctx
    |> Factory.add_project(:project_active, :product, goal: :goal, name: "Active Project")
    |> Factory.add_project(:project_to_close, :product, goal: :goal, name: "Project To Close")
    |> Factory.add_project(:project_paused, :product, goal: :goal, name: "Paused Project")
    |> then(fn ctx ->
      # Pause one project
      Operately.Operations.ProjectPausing.run(ctx.creator, ctx.project_paused)
      ctx
    end)
  end

  step :given_closed_goal_exists, ctx do
    ctx
    |> Factory.add_goal_update(:check_in, :goal, :champion)
    |> Factory.close_goal(:goal)
  end

  step :given_goal_with_no_projects_exists, ctx do
    # Goal already created in setup, no projects to add
    ctx
  end

  step :close_some_projects, ctx do
    # Close one project using the proper operation that sets closed_at
    {:ok, _} =
      Operately.Operations.ProjectClosed.run(ctx.creator, ctx.project_to_close, %{
        content: RichText.rich_text("Project closed for testing"),
        success_status: :achieved,
        subscription_parent_type: :comment_thread,
        send_to_everyone: false,
        subscriber_ids: []
      })

    ctx
  end

  step :close_all_projects, ctx do
    projects = [ctx.project_active, ctx.project_to_close, ctx.project_paused]

    Enum.each(projects, fn project ->
      {:ok, _} =
        Operately.Operations.ProjectClosed.run(ctx.creator, project, %{
          content: RichText.rich_text("Project closed for testing"),
          success_status: :achieved,
          subscription_parent_type: :comment_thread,
          send_to_everyone: false,
          subscriber_ids: []
        })
    end)

    ctx
  end

  step :close_goal, ctx do
    goal_path = OperatelyWeb.Paths.goal_path(ctx.company, ctx.goal)

    ctx
    |> UI.click(testid: "close-goal-button")
    |> UI.wait_until_testid(testid: "goal-closing-page")
    |> UI.fill_rich_text("We are closing the goal.")
    |> UI.click_button("Close Goal")
    |> wait_until_goal_closed()
    |> UI.visit(goal_path)
    |> UI.wait_until_testid(testid: "goal-page")
    |> UI.wait_until_has(testid: "page-header")
    |> UI.wait_until_has(testid: "closed-status-banner")
  end

  step :reopen_goal, ctx do
    goal_path = OperatelyWeb.Paths.goal_path(ctx.company, ctx.goal)

    ctx
    |> UI.click(testid: "reopen-goal-button")
    |> UI.wait_until_text("Reopening Goal")
    |> UI.fill_rich_text("We are reopening the goal.")
    |> UI.click_button("Reopen Goal")
    |> wait_until_goal_open()
    |> UI.visit(goal_path)
    |> UI.wait_until_testid(testid: "goal-page")
    |> UI.wait_until_has(testid: "page-header")
    |> UI.wait_until_has(testid: "close-goal-button")
    |> UI.refute_has(testid: "closed-status-banner")
    |> UI.wait_until_text("On track", testid: "page-header")
  end

  step :visit_goal_page, ctx do
    ctx
    |> UI.visit(OperatelyWeb.Paths.goal_path(ctx.company, ctx.goal))
    |> UI.wait_until_testid(testid: "goal-page")
    |> UI.wait_until_has(testid: "page-header")
  end

  step :visit_goal_closing_page, ctx do
    path = OperatelyWeb.Paths.goal_closing_path(ctx.company, ctx.goal)

    ctx
    |> UI.visit(path)
    |> UI.assert_has(testid: "goal-closing-page")
  end

  step :assert_goal_is_closed, ctx do
    ctx
    |> UI.find(UI.query(testid: "page-header"), fn el ->
      UI.assert_text(el, "Achieved")
    end)
    |> UI.find(UI.query(testid: "sidebar"), fn el ->
      el
      |> UI.assert_text("Goal Retrospective")
      |> UI.assert_has(testid: "reopen-goal-button")
    end)
  end

  step :assert_goal_is_reopened, ctx do
    ctx
    |> UI.find(UI.query(testid: "page-header"), fn el ->
      UI.assert_text(el, "On track")
    end)
    |> UI.find(UI.query(testid: "sidebar"), fn el ->
      el
      |> UI.assert_text("Last update")
      |> UI.assert_has(testid: "close-goal-button")
    end)
    |> UI.refute_text("Achieved")
    |> UI.refute_text("Goal Retrospective")
    |> UI.refute_has(testid: "reopen-goal-button")
  end

  step :assert_goal_closed_status_banner_visible, ctx do
    UI.wait_until_testid(ctx, testid: "closed-status-banner")
  end

  step :assert_goal_closed_status_banner_not_visible, ctx do
    UI.refute_has(ctx, testid: "closed-status-banner")
  end

  step :assert_closed_projects_not_shown_in_warning, ctx do
    ctx
    # This project was closed and shouldn't appear
    |> UI.refute_text("Project To Close")
  end

  step :assert_active_projects_shown_in_warning, ctx do
    ctx
    # This project is active and should appear
    |> UI.assert_text("Active Project")
    # Paused projects should also appear as active
    |> UI.assert_text("Paused Project")
  end

  step :assert_no_active_projects_warning, ctx do
    # When all projects are closed, there should be no warning about active projects
    ctx
    |> UI.refute_text("Active Project")
    |> UI.refute_text("Project To Close")
    |> UI.refute_text("Paused Project")
  end

  step :assert_open_goal_in_all_work_tab_in_work_map, ctx do
    ctx
    |> UI.visit(OperatelyWeb.Paths.work_map_path(ctx.company, tab: :all))
    |> UI.assert_text("#{ctx.company.name} Work Map")
    |> UI.assert_text(ctx.goal.name)
  end

  step :assert_open_goal_in_goals_tab_in_work_map, ctx do
    ctx
    |> UI.visit(OperatelyWeb.Paths.work_map_path(ctx.company, tab: :goals))
    |> UI.assert_text("#{ctx.company.name} Work Map")
    |> UI.assert_text(ctx.goal.name)
  end

  step :assert_closed_goal_in_completed_tab_in_work_map, ctx do
    ctx
    |> UI.visit(OperatelyWeb.Paths.work_map_path(ctx.company, tab: :completed))
    |> UI.assert_text("#{ctx.company.name} Work Map")
    |> UI.assert_text(ctx.goal.name)
  end

  step :refute_open_goal_in_completed_tab_in_work_map, ctx do
    ctx
    |> UI.visit(OperatelyWeb.Paths.work_map_path(ctx.company, tab: :completed))
    |> UI.assert_text("#{ctx.company.name} Work Map")
    |> UI.refute_text(ctx.goal.name)
  end

  step :refute_closed_goal_in_all_work_tab_in_work_map, ctx do
    ctx
    |> UI.visit(OperatelyWeb.Paths.work_map_path(ctx.company, tab: :all))
    |> UI.assert_text("#{ctx.company.name} Work Map")
    |> UI.refute_text(ctx.goal.name)
  end

  step :refute_closed_goal_in_goals_tab_in_work_map, ctx do
    ctx
    |> UI.visit(OperatelyWeb.Paths.work_map_path(ctx.company, tab: :goals))
    |> UI.assert_text("#{ctx.company.name} Work Map")
    |> UI.refute_text(ctx.goal.name)
  end

  defp wait_until_goal_closed(ctx, attempts \\ [50, 100, 200, 400, 800, 1600, 3200]) do
    goal = reload_goal(ctx.goal)

    cond do
      goal.closed_at ->
        Map.put(ctx, :goal, goal)

      attempts == [] ->
        flunk("Timed out waiting for goal to close")

      true ->
        [delay | remaining] = attempts
        :timer.sleep(delay)
        wait_until_goal_closed(ctx, remaining)
    end
  end

  defp wait_until_goal_open(ctx, attempts \\ [50, 100, 200, 400, 800, 1600, 3200]) do
    goal = reload_goal(ctx.goal)

    cond do
      is_nil(goal.closed_at) ->
        Map.put(ctx, :goal, goal)

      attempts == [] ->
        flunk("Timed out waiting for goal to reopen")

      true ->
        [delay | remaining] = attempts
        :timer.sleep(delay)
        wait_until_goal_open(ctx, remaining)
    end
  end

  defp reload_goal(goal) do
    Operately.Repo.get!(Operately.Goals.Goal, goal.id)
  end
end
