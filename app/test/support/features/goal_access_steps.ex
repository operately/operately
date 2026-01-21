defmodule Operately.Support.Features.GoalAccessSteps do
  use Operately.FeatureCase

  alias Operately.Access
  alias Operately.Access.Binding

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
    |> Factory.log_in_person(:creator)
  end

  step :setup_with_edit_access, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:space_member, :space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer, space_access: Binding.edit_access())
  end

  step :visit_goal_access_management_page, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.click(testid: "manage-goal-access-button")
    |> UI.assert_has(testid: "goal-access-management-page")
  end

  step :visit_goal_page, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
  end

  step :ensure_logged_in_user_has_edit_access, ctx do
    {:ok, goal} = Operately.Goals.Goal.get(ctx.space_member, id: ctx.goal.id)
    assert goal.request_info.access_level == Binding.edit_access()

    Factory.log_in_person(ctx, :space_member)
  end

  step :assert_manage_access_button_not_visible, ctx do
    ctx
    |> UI.refute_has(testid: "manage-goal-access-button")
  end

  step :visit_goal_access_page_directly_and_assert_404, ctx do
    ctx
    |> UI.visit(Paths.goal_access_path(ctx.company, ctx.goal))
    |> UI.assert_text("Page Not Found")
  end

  step :given_company_member_exists, ctx do
    Factory.add_company_member(ctx, :member)
  end

  step :given_direct_access_member, ctx, access_level: access_level do
    ctx = Factory.add_space_member(ctx, :member, :space)

    context = Access.get_context!(goal_id: ctx.goal.id)
    {:ok, _} = Access.bind_person(context, ctx.member.id, access_level)

    ctx
  end

  step :assert_access_members_listed, ctx do
    ctx
    |> UI.assert_text(ctx.champion.full_name)
    |> UI.assert_text(ctx.reviewer.full_name)
    |> UI.assert_text(ctx.member.full_name)
  end

  step :add_goal_access_member, ctx, access_level: access_level do
    ctx
    |> UI.click(testid: "add-goal-access")
    |> UI.assert_has(testid: "goal-access-add-page")
    |> UI.select_person_in(testid: "members-0-personid", name: ctx.member.full_name)
    |> UI.select(testid: "members-0-accesslevel", option: access_level_label(access_level, upcase: false))
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "goal-access-management-page")
  end

  step :assert_access_member_added, ctx, access_level: access_level do
    ctx
    |> UI.assert_text(ctx.member.full_name)
    |> UI.assert_text(access_level_label(access_level, upcase: true))

    attempts(ctx, 3, fn ->
      assert_binding_access(ctx.goal, ctx.member, access_level)
    end)
  end

  step :change_access_level, ctx, access_level: access_level do
    ctx
    |> UI.click(testid: UI.testid(["goal-access-menu", ctx.member.full_name]))
    |> UI.click(testid: "change-access-level")
    |> UI.click(testid: access_level_testid(access_level))
    |> UI.sleep(200)
  end

  step :assert_access_level_changed, ctx, access_level: access_level do
    ctx
    |> UI.assert_text(access_level_label(access_level, upcase: true))

    attempts(ctx, 3, fn ->
      assert_binding_access(ctx.goal, ctx.member, access_level)
    end)
  end

  step :remove_access_member, ctx do
    ctx
    |> UI.click(testid: UI.testid(["goal-access-menu", ctx.member.full_name]))
    |> UI.click(testid: "remove-goal-access")
    |> UI.sleep(200)
  end

  step :assert_access_member_removed, ctx do
    ctx
    |> UI.refute_text(ctx.member.full_name)

    attempts(ctx, 3, fn ->
      refute direct_binding(ctx.goal, ctx.member)
    end)
  end

  #
  # Helpers
  #

  defp access_level_label(access_level, upcase: upcase) do
    result =
      cond do
        access_level == Binding.full_access() -> "Full Access"
        access_level == Binding.edit_access() -> "Edit Access"
        access_level == Binding.comment_access() -> "Comment Access"
        access_level == Binding.view_access() -> "View Access"
        true -> "Unknown Access"
      end

    if upcase, do: String.upcase(result), else: result
  end

  defp access_level_testid(access_level) do
    cond do
      access_level == Binding.full_access() -> "full-access"
      access_level == Binding.edit_access() -> "edit-access"
      access_level == Binding.comment_access() -> "comment-access"
      access_level == Binding.view_access() -> "view-access"
      true -> "view-access"
    end
  end

  defp direct_binding(goal, person) do
    context = Access.get_context!(goal_id: goal.id)
    group = Access.get_group!(person_id: person.id)

    Access.get_binding(context_id: context.id, group_id: group.id)
  end

  defp assert_binding_access(goal, person, access_level) do
    binding = direct_binding(goal, person)

    assert binding
    assert binding.access_level == access_level
  end
end
