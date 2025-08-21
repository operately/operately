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

  step :visit_goal_closing_page, ctx do
    path = OperatelyWeb.Paths.goal_closing_path(ctx.company, ctx.goal)

    ctx
    |> UI.visit(path)
    |> UI.assert_has(testid: "goal-closing-page")
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
end
