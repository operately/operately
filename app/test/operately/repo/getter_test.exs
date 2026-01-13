defmodule Operately.Repo.GetterTest do
  use Operately.DataCase

  alias Operately.Access.Binding
  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.Support.Factory

  setup do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_goal(:restricted_goal, :space, company_access: Binding.no_access(), space_access: Binding.no_access())
      |> Factory.add_project(:restricted_project, :space,
        goal: :restricted_goal,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
      |> Factory.add_project_contributor(:viewer, :restricted_project, :as_person)
      |> Factory.add_goal(:open_goal, :space, company_access: Binding.view_access(), space_access: Binding.no_access())
      |> Factory.add_project(:open_project, :space,
        goal: :open_goal,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
      |> Factory.add_project(:closed_project, :space,
        goal: :open_goal,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )

    ctx = Factory.add_project_contributor(ctx, :viewer_on_open_project, :open_project, viewer_on_open_project: ctx.viewer)

    {:ok, ctx}
  end

  test "auth_preload filters a single association", ctx do
    # Viewer has no access to the project, so the goal is not loaded
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal]]
             )

    assert project.goal == nil

    # Creator has access to the project, so the goal is loaded
    assert {:ok, project} =
             Project.get(ctx.creator,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal]]
             )

    assert project.goal.id == ctx.restricted_goal.id
  end

  test "auth_preload filters only listed associations when combined with preload", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal], preload: [:group]]
             )

    assert project.goal == nil
    assert project.group.id == ctx.space.id
  end

  test "preload works regardless of access levels", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [preload: [:goal, :group]]
             )

    assert project.goal.id == ctx.restricted_goal.id
    assert project.group.id == ctx.space.id
  end

  test "auth_preload overrides preload for the same association", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [preload: [:goal], auth_preload: [:goal]]
             )

    assert project.goal == nil
  end

  test "auth_preload filters multiple associations", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal, :group]]
             )

    assert project.goal == nil
    assert project.group == nil
  end

  test "auth_preload works with normal preloads in the same query", ctx do
    assert {:ok, project} =
             Project.get(ctx.viewer,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal, :group], preload: [contributors: :person]]
             )

    assert project.goal == nil
    assert project.group == nil
    assert Enum.any?(project.contributors, &(&1.person_id == ctx.viewer.id))
  end

  test "auth_preload loads associations when requester has access", ctx do
    assert {:ok, project} =
             Project.get(ctx.creator,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal, :group]]
             )

    assert project.goal.id == ctx.restricted_goal.id
    assert project.group.id == ctx.space.id
  end

  test "auth_preload behaves like preload for system requester", ctx do
    assert {:ok, project} =
             Project.get(:system,
               id: ctx.restricted_project.id,
               opts: [auth_preload: [:goal, :group]]
             )

    assert project.goal.id == ctx.restricted_goal.id
    assert project.group.id == ctx.space.id
  end

  test "auth_preload filters has_many associations", ctx do
    assert {:ok, goal} =
             Goal.get(ctx.viewer,
               id: ctx.open_goal.id,
               opts: [auth_preload: [:projects]]
             )

    project_ids = Enum.map(goal.projects, & &1.id)

    assert ctx.open_project.id in project_ids
    refute ctx.closed_project.id in project_ids
  end
end
