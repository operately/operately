defmodule Operately.Features.ProjectGoalTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx = Steps.create_project(ctx, name: "Test Project")
    ctx = Steps.login(ctx)

    ctx = create_goal(ctx, "Increase feedback score to 90%")
    ctx = create_goal(ctx, "Improve support first response time")

    ctx = Map.put(ctx, :goal, hd(ctx.goals))

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "connect a goal to a project", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.choose_new_goal(goal_name: "Improve support first response time")
    |> Steps.assert_goal_connected(goal_name: "Improve support first response time")
    |> Steps.assert_goal_link_on_project_page(goal_name: "Improve support first response time")
    |> Steps.assert_goal_connected_email_sent_to_champion(goal_name: "Improve support first response time")
  end

  @tag login_as: :champion
  feature "disconnect a goal from a project", ctx do
    ctx
    |> Steps.connect_goal(ctx.goal)
    |> Steps.visit_project_page()
    |> Steps.assert_goal_connected(goal_name: ctx.goal.name)
    |> Steps.disconnect_goal()
    |> Steps.assert_goal_link_not_on_project_page()
    |> Steps.assert_goal_disconnected_email_sent_to_champion(goal_name: ctx.goal.name)
    |> Steps.assert_goal_disconnected_notification_sent_to_reviewer()
  end

  #
  # Utility
  #

  defp create_goal(ctx, name) do
    {:ok, goal} = Operately.Goals.create_goal(ctx.champion, %{
      company_id: ctx.company.id,
      space_id: ctx.group.id,
      name: name,
      champion_id: ctx.champion.id,
      reviewer_id: ctx.reviewer.id,
      timeframe: "2023-Q4",
      targets: [
        %{
          name: "First response time",
          from: 30,
          to: 15,
          unit: "minutes",
          index: 0
        },
        %{
          name: "Increase feedback score to 90%",
          from: 80,
          to: 90,
          unit: "percent",
          index: 1
        }
      ]
    })

    if ctx[:goals] do
      Map.put(ctx, :goals, [goal | ctx.goals])
    else
      Map.put(ctx, :goals, [goal])
    end
  end
end
