defmodule Operately.Support.Features.OutsideCollaboratorAccessSteps do
  use Operately.FeatureCase

  alias Operately.Access
  alias Operately.Access.Binding

  step :setup_project_with_parent_goal, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.enable_feature("guest-accounts")
    |> Factory.add_space(:space, company_permissions: Binding.edit_access())
    |> Factory.add_goal(:parent_goal, :space, name: "Parent Goal", company_access: Binding.edit_access(), space_access: Binding.edit_access())
    |> Factory.add_project(:project, :space, name: "Test Project", goal: :parent_goal, company_access_level: Binding.edit_access(), space_access_level: Binding.edit_access())
    |> Factory.add_outside_collaborator(:collaborator, :owner)
    |> Factory.add_company_member(:member)
  end

  step :setup_goal_with_parent_goal, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.enable_feature("guest-accounts")
    |> Factory.add_space(:space, company_permissions: Binding.edit_access())
    |> Factory.add_goal(:parent_goal, :space, name: "Parent Goal", company_access: Binding.edit_access(), space_access: Binding.edit_access())
    |> Factory.add_goal(:goal, :space, name: "Test Goal", parent_goal: :parent_goal, company_access: Binding.edit_access(), space_access: Binding.edit_access())
    |> Factory.add_outside_collaborator(:collaborator, :owner)
    |> Factory.add_company_member(:member)
  end

  step :log_in_as_collaborator, ctx do
    ctx |> UI.login_as(ctx.collaborator)
  end

  step :visit_project_page, ctx do
    ctx |> UI.visit(Paths.project_path(ctx.company, ctx.project))
  end

  step :visit_goal_page, ctx do
    ctx |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
  end

  step :visit_parent_goal_page, ctx do
    ctx |> UI.visit(Paths.goal_path(ctx.company, ctx.parent_goal))
  end

  step :visit_space_page, ctx do
    ctx |> UI.visit(Paths.space_path(ctx.company, ctx.space))
  end

  step :assert_404_page, ctx do
    ctx |> UI.assert_text("Page Not Found")
  end

  step :assert_parent_goal_not_visible, ctx do
    ctx |> UI.refute_text(ctx.parent_goal.name)
  end

  step :assert_space_not_in_navigation, ctx do
    ctx |> UI.refute_has(testid: UI.testid(["space-link", ctx.space.name]))
  end

  step :assert_move_space_option_not_visible, ctx do
    ctx |> UI.refute_has(testid: "move-to-space-button")
  end

  #
  # Project access
  #

  step :assert_only_company_member_has_edit_access_to_project, ctx do
    {:error, :not_found} = Operately.Projects.Project.get(ctx.collaborator, id: ctx.project.id)
    {:ok, project} = Operately.Projects.Project.get(ctx.member, id: ctx.project.id)

    assert project.request_info.access_level == Binding.edit_access()

    ctx
  end

  step :assert_only_company_member_has_edit_access_to_parent_goal, ctx do
    {:error, :not_found} = Operately.Goals.Goal.get(ctx.collaborator, id: ctx.parent_goal.id)
    {:ok, goal} = Operately.Goals.Goal.get(ctx.member, id: ctx.parent_goal.id)

    assert goal.request_info.access_level == Binding.edit_access()

    ctx
  end

  step :assert_only_company_member_has_edit_access_to_space, ctx do
    {:error, :not_found} = Operately.Groups.Group.get(ctx.collaborator, id: ctx.space.id)
    {:ok, space} = Operately.Groups.Group.get(ctx.member, id: ctx.space.id)

    assert space.request_info.access_level == Binding.edit_access()

    ctx
  end

  step :assert_project_page_visible, ctx do
    ctx |> UI.assert_text(ctx.project.name)
  end

  step :give_collaborator_project_access, ctx do
    context = Access.get_context!(project_id: ctx.project.id)
    {:ok, _} = Access.bind_person(context, ctx.collaborator.id, Binding.view_access())
    ctx
  end

  #
  # Goal access
  #

  step :assert_goal_page_visible, ctx do
    ctx |> UI.assert_text(ctx.goal.name)
  end

  step :assert_only_company_member_has_edit_access_to_goal, ctx do
    {:error, :not_found} = Operately.Goals.Goal.get(ctx.collaborator, id: ctx.goal.id)
    {:ok, goal} = Operately.Goals.Goal.get(ctx.member, id: ctx.goal.id)

    assert goal.request_info.access_level == Binding.edit_access()

    ctx
  end

  step :give_collaborator_goal_access, ctx do
    context = Access.get_context!(goal_id: ctx.goal.id)
    {:ok, _} = Access.bind_person(context, ctx.collaborator.id, Binding.view_access())
    ctx
  end

  #
  # Space creation
  #

  step :setup_outside_collaborator, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.enable_feature("guest-accounts")
    |> Factory.add_outside_collaborator(:collaborator, :owner)
  end

  step :visit_home_page, ctx do
    ctx |> UI.visit(Paths.home_path(ctx.company))
  end

  step :visit_new_space_page, ctx do
    ctx |> UI.visit(Paths.new_space_path(ctx.company))
  end

  step :assert_add_space_button_not_visible, ctx do
    ctx |> UI.refute_has(testid: "add-space")
  end

  step :fill_space_form, ctx, %{name: name, mission: mission} do
    ctx
    |> UI.fill(testid: "name", with: name)
    |> UI.fill(testid: "mission", with: mission)
  end

  step :submit_space_form, ctx do
    ctx |> UI.click(testid: "submit")
  end

  step :assert_permission_error_message, ctx do
    ctx |> UI.assert_text("You don't have permission to perform this action")
  end
end
