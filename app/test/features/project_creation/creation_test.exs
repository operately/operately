defmodule Operately.Features.ProjectCreation.CreationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectCreationSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :champion

  feature "add project", ctx do
    params = %{name: "Website Redesign", space: ctx.group, creator: ctx.champion, champion: ctx.champion, reviewer: ctx.reviewer}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_project_created_email_sent(params)
    |> Steps.assert_project_created_notification_sent(params)
    |> Steps.assert_project_created_feed()
  end

  feature "add project and assign someone else as champion, myself as reviewer", ctx do
    params = %{name: "Website Redesign", space: ctx.group, creator: ctx.reviewer, champion: ctx.champion, reviewer: ctx.reviewer}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_project_created_email_sent(params)
    |> Steps.assert_project_created_notification_sent(params)
    |> Steps.assert_project_created_feed(ctx.reviewer)
  end

  feature "creator is added as contributor when creating a project", ctx do
    params = %{name: "Website Redesign", space: ctx.group, creator: ctx.non_contributor, champion: ctx.champion, reviewer: ctx.reviewer}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_creator_is_contributor(params)
  end

  feature "select a parent goal while adding a project", ctx do
    params = %{
      name: "Website Redesign",
      space: ctx.group,
      creator: ctx.champion,
      champion: ctx.champion,
      reviewer: ctx.reviewer,
      goal: ctx.goal
    }

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_project_created_email_sent(params)
    |> Steps.assert_project_created_notification_sent(params)
    |> Steps.assert_project_created_feed()
  end
end
