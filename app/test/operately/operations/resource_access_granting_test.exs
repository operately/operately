defmodule Operately.Operations.ResourceAccessGrantingTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Access.GroupMembership
  alias Operately.Groups
  alias Operately.Projects.Contributor
  alias Operately.Support.Factory

  setup do
    ctx = Factory.setup(%{})

    ctx
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:guest)
  end

  describe "granting access to a space" do
    test "creates access binding for the person on the space", ctx do
      resources = [%{resource_type: :space, resource_id: ctx.space.id, access_level: :edit_access}]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      context = Access.get_context!(group_id: ctx.space.id)
      binding = Access.get_binding(context, person_id: ctx.guest.id)

      assert binding
      assert binding.access_level == Binding.edit_access()
    end

    test "adds the person as a space member", ctx do
      resources = [%{resource_type: :space, resource_id: ctx.space.id, access_level: :edit_access}]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      members = Groups.list_members(ctx.space)
      member_ids = Enum.map(members, & &1.id)

      assert ctx.guest.id in member_ids
    end

    test "does not duplicate space member if already exists", ctx do
      resources = [%{resource_type: :space, resource_id: ctx.space.id, access_level: :edit_access}]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)
      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      members = Groups.list_members(ctx.space)
      guest_count = Enum.count(members, fn m -> m.id == ctx.guest.id end)

      assert guest_count == 1
    end

    test "creates a group membership in the standard access group", ctx do
      resources = [%{resource_type: :space, resource_id: ctx.space.id, access_level: :edit_access}]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      standard_group = Access.get_group!(group_id: ctx.space.id, tag: :standard)
      membership = Access.get_group_membership(group_id: standard_group.id, person_id: ctx.guest.id)

      assert membership
      assert membership.person_id == ctx.guest.id
      assert membership.group_id == standard_group.id
    end

    test "does not duplicate group membership if already exists", ctx do
      resources = [%{resource_type: :space, resource_id: ctx.space.id, access_level: :edit_access}]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)
      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      standard_group = Access.get_group!(group_id: ctx.space.id, tag: :standard)
      memberships = Repo.all(from m in GroupMembership, where: m.group_id == ^standard_group.id and m.person_id == ^ctx.guest.id)

      assert length(memberships) == 1
    end
  end

  describe "granting access to a goal" do
    test "creates access binding for the person on the goal", ctx do
      resources = [%{resource_type: :goal, resource_id: ctx.goal.id, access_level: :comment_access}]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      context = Access.get_context!(goal_id: ctx.goal.id)
      binding = Access.get_binding(context, person_id: ctx.guest.id)

      assert binding
      assert binding.access_level == Binding.comment_access()
    end
  end

  describe "granting access to a project" do
    test "creates access binding for the person on the project", ctx do
      resources = [%{resource_type: :project, resource_id: ctx.project.id, access_level: :edit_access}]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      context = Access.get_context!(project_id: ctx.project.id)
      binding = Access.get_binding(context, person_id: ctx.guest.id)

      assert binding
      assert binding.access_level == Binding.edit_access()
    end

    test "adds the person as a project contributor", ctx do
      resources = [%{resource_type: :project, resource_id: ctx.project.id, access_level: :edit_access}]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      contributor = Repo.get_by(Contributor, project_id: ctx.project.id, person_id: ctx.guest.id)

      assert contributor
      assert contributor.role == :contributor
    end

    test "does not duplicate contributor if already exists", ctx do
      resources = [%{resource_type: :project, resource_id: ctx.project.id, access_level: :edit_access}]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)
      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      contributors = Repo.all(from c in Contributor, where: c.project_id == ^ctx.project.id and c.person_id == ^ctx.guest.id)

      assert length(contributors) == 1
    end
  end

  describe "granting access to multiple resources" do
    test "creates bindings for all resources in a single transaction", ctx do
      resources = [
        %{resource_type: :space, resource_id: ctx.space.id, access_level: :edit_access},
        %{resource_type: :goal, resource_id: ctx.goal.id, access_level: :view_access},
        %{resource_type: :project, resource_id: ctx.project.id, access_level: :full_access},
      ]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      space_context = Access.get_context!(group_id: ctx.space.id)
      goal_context = Access.get_context!(goal_id: ctx.goal.id)
      project_context = Access.get_context!(project_id: ctx.project.id)

      space_binding = Access.get_binding(space_context, person_id: ctx.guest.id)
      goal_binding = Access.get_binding(goal_context, person_id: ctx.guest.id)
      project_binding = Access.get_binding(project_context, person_id: ctx.guest.id)

      assert space_binding.access_level == Binding.edit_access()
      assert goal_binding.access_level == Binding.view_access()
      assert project_binding.access_level == Binding.full_access()
    end
  end

  describe "deduplication" do
    test "keeps the entry with the highest access level when duplicates exist for the same resource", ctx do
      resources = [
        %{resource_type: :space, resource_id: ctx.space.id, access_level: :view_access},
        %{resource_type: :space, resource_id: ctx.space.id, access_level: :full_access},
        %{resource_type: :space, resource_id: ctx.space.id, access_level: :edit_access},
      ]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      context = Access.get_context!(group_id: ctx.space.id)
      binding = Access.get_binding(context, person_id: ctx.guest.id)

      assert binding.access_level == Binding.full_access()
    end

    test "deduplicates across different resource types independently", ctx do
      resources = [
        %{resource_type: :space, resource_id: ctx.space.id, access_level: :view_access},
        %{resource_type: :space, resource_id: ctx.space.id, access_level: :edit_access},
        %{resource_type: :goal, resource_id: ctx.goal.id, access_level: :comment_access},
        %{resource_type: :goal, resource_id: ctx.goal.id, access_level: :full_access},
      ]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      space_context = Access.get_context!(group_id: ctx.space.id)
      goal_context = Access.get_context!(goal_id: ctx.goal.id)

      assert Access.get_binding(space_context, person_id: ctx.guest.id).access_level == Binding.edit_access()
      assert Access.get_binding(goal_context, person_id: ctx.guest.id).access_level == Binding.full_access()
    end

    test "does not affect entries when there are no duplicates", ctx do
      resources = [
        %{resource_type: :space, resource_id: ctx.space.id, access_level: :view_access},
        %{resource_type: :goal, resource_id: ctx.goal.id, access_level: :edit_access},
        %{resource_type: :project, resource_id: ctx.project.id, access_level: :full_access},
      ]

      assert {:ok, _} = Operately.Operations.ResourceAccessGranting.run(ctx.guest.id, resources)

      space_context = Access.get_context!(group_id: ctx.space.id)
      goal_context = Access.get_context!(goal_id: ctx.goal.id)
      project_context = Access.get_context!(project_id: ctx.project.id)

      assert Access.get_binding(space_context, person_id: ctx.guest.id).access_level == Binding.view_access()
      assert Access.get_binding(goal_context, person_id: ctx.guest.id).access_level == Binding.edit_access()
      assert Access.get_binding(project_context, person_id: ctx.guest.id).access_level == Binding.full_access()
    end
  end
end
