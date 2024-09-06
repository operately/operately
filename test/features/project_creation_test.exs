defmodule Operately.Features.ProjectCreationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectCreationSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :champion
  feature "add project", ctx do
    params = %{name: "Website Redesign", creator: ctx.champion, champion: ctx.champion, reviewer: ctx.reviewer}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_project_created_email_sent(params)
    |> Steps.assert_project_created_notification_sent(params)
  end

  @tag login_as: :reviewer
  feature "add project and assign someone else as champion, myself as reviewer", ctx do
    params = %{name: "Website Redesign", creator: ctx.reviewer, champion: ctx.champion, reviewer: ctx.reviewer}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_project_created_email_sent(params)
    |> Steps.assert_project_created_notification_sent(params)
  end

  @tag login_as: :non_contributor
  feature "add project for someone else, I'm not a contributor", ctx do
    params = %{name: "Website Redesign", creator: ctx.non_contributor, champion: ctx.champion, reviewer: ctx.reviewer}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_project_created_email_sent(params)
    |> Steps.assert_project_created_notification_sent(params)
  end


  @tag login_as: :project_manager
  feature "add project for someone else, I'm a contributor", ctx do
    params = %{name: "Website Redesign", creator: ctx.project_manager, champion: ctx.champion, reviewer: ctx.reviewer, add_creator_as_contributor: true}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_project_created_email_sent(params)
    |> Steps.assert_project_created_notification_sent(params)
  end

  @tag login_as: :champion
  feature "select a parent goal while adding a project", ctx do
    params = %{
      name: "Website Redesign",
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
  end

  @tag login_as: :champion
  feature "operately prefills the reviewer with the champion's manager", ctx do
    params = %{name: "Website Redesign", creator: ctx.champion, champion: ctx.champion}

    ctx
    |> Steps.given_that_champion_has_a_manager()
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_reviewer_is_champions_manager(params)
  end

  @tag login_as: :champion
  feature "champion == reviewer is not allowed", ctx do
    params = %{name: "Website Redesign", creator: ctx.champion, champion: ctx.champion, reviewer: ctx.champion}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_validation_error("Can't be the same as the champion")
  end

  @tag login_as: :champion
  feature "creating a project with no reviewer", ctx do
    params = %{name: "Website Redesign", creator: ctx.champion, champion: ctx.champion}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
  end
end
