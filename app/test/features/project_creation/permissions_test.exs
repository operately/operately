defmodule Operately.Features.ProjectCreation.PermissionsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectCreationSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :champion

  feature "champion == reviewer is not allowed", ctx do
    params = %{name: "Website Redesign", space: ctx.group, creator: ctx.champion, champion: ctx.champion, reviewer: ctx.champion}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_validation_error("Can't be the same as the champion")
  end

  @tag login_as: :champion
  feature "creating a project without space is not allowed", ctx do
    params = %{name: "Website Redesign", creator: ctx.champion, champion: ctx.champion}

    ctx
    |> Steps.start_adding_project_from_lobby()
    |> Steps.submit_project_form(params)
    |> Steps.assert_validation_error("Space is required")
  end

  @tag login_as: :champion
  feature "creating a project with no reviewer", ctx do
    params = %{name: "Website Redesign", space: ctx.group, creator: ctx.champion, champion: ctx.champion}

    ctx
    |> Steps.start_adding_project()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_review_field_showing()
    |> Steps.follow_add_reviewer_link_and_add_reviewer()
    |> Steps.assert_project_has_reviewer(params)
    |> Steps.assert_project_created_feed()
  end

  @tag login_as: :champion
  feature "creating a project in a confidential space", ctx do
    params = %{name: "Website Redesign", creator: ctx.champion, reviewer: ctx.reviewer, champion: ctx.champion}

    ctx
    |> Steps.given_that_space_is_hidden_from_company_members()
    |> Steps.start_adding_project()
    |> Steps.select_space(ctx.group.name)
    |> Steps.assert_form_offers_space_wide_access_level()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_company_members_cant_see_project(params)
    |> Steps.assert_space_members_can_see_project(params)
    |> Steps.assert_project_created_feed()
  end

  @tag login_as: :champion
  feature "creating an invite-only project in a confidential space", ctx do
    params = %{name: "Website Redesign", creator: ctx.champion, reviewer: ctx.reviewer, champion: ctx.champion}

    ctx
    |> Steps.given_that_space_is_hidden_from_company_members()
    |> Steps.start_adding_project()
    |> Steps.select_space(ctx.group.name)
    |> Steps.assert_form_offers_space_wide_access_level()
    |> Steps.change_project_access_level_to_invite_only()
    |> Steps.submit_project_form(params)
    |> Steps.assert_project_created(params)
    |> Steps.assert_company_members_cant_see_project(params)
    |> Steps.assert_space_members_cant_see_project(params)
    |> Steps.assert_project_created_feed()
  end
end
