defmodule Operately.Support.Features.NavigationSteps do
  use Operately.FeatureCase

  alias Operately.Access.Binding
  alias Operately.Companies.Company
  alias Operately.Groups.Group

  step :given_a_user_is_logged_in_as_admin, ctx do
    ctx = Factory.add_company_admin(ctx, :admin, name: "Admin User")

    company = Company.get!(ctx.admin, id: ctx.company.id)
    assert company.request_info.access_level == Binding.admin_access()

    UI.login_as(ctx, ctx.admin)
  end

  step :given_a_user_is_logged_in_with_edit_access, ctx do
    ctx = Factory.add_company_member(ctx, :member)
    ctx = Factory.set_company_access_level(ctx, :member, Binding.edit_access())

    company = Company.get!(ctx.member, id: ctx.company.id)
    assert company.request_info.access_level == Binding.edit_access()

    UI.login_as(ctx, ctx.member)
  end

  step :given_a_user_is_logged_in_with_comment_access, ctx do
    ctx = Factory.add_company_member(ctx, :member)
    ctx = Factory.set_company_access_level(ctx, :member, Binding.comment_access())

    company = Company.get!(ctx.member, id: ctx.company.id)
    assert company.request_info.access_level == Binding.comment_access()

    UI.login_as(ctx, ctx.member)
  end

  step :given_user_has_comment_access_to_spaces, ctx do
    space_id = ctx.company.company_space_id

    access_group = Operately.Access.get_group!(person_id: ctx.member.id)
    access_context = Operately.Access.get_context!(group_id: space_id)

    Operately.Access.bind(access_context, access_group_id: access_group.id, level: Binding.comment_access())

    company_space = Group.get!(ctx.member, id: space_id)
    assert company_space.request_info.access_level == Binding.comment_access()

    ctx
  end

  step :visit_home_page, ctx do
    path = OperatelyWeb.Paths.home_path(ctx.company)
    UI.visit(ctx, path)
  end

  step :assert_new_dropdown_is_visible, ctx do
    ctx |> UI.assert_has(testid: "new-dropdown")
  end

  step :assert_new_dropdown_is_hidden, ctx do
    ctx |> UI.refute_has(testid: "new-dropdown")
  end

  step :assert_new_goal_is_visible, ctx do
    ctx
    |> UI.click(testid: "new-dropdown")
    |> UI.assert_has(testid: "new-dropdown-new-goal")
  end

  step :assert_new_project_is_visible, ctx do
    ctx |> UI.assert_has(testid: "new-dropdown-new-project")
  end

  step :assert_new_space_is_visible, ctx do
    ctx |> UI.assert_has(testid: "new-dropdown-new-space")
  end

  step :assert_new_space_is_hidden, ctx do
    ctx |> UI.refute_has(testid: "new-dropdown-new-space")
  end

  step :assert_invite_people_is_visible, ctx do
    ctx |> UI.assert_has(testid: "new-dropdown-new-team-member")
  end

  step :assert_invite_people_is_hidden, ctx do
    ctx |> UI.refute_has(testid: "new-dropdown-new-team-member")
  end
end
