defmodule Operately.Data.Change050CreateBindingsBetweenPeopleAndCompanySpaceTest do
  use Operately.DataCase

  alias Operately.{Access, Companies}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:bob)
    |> Factory.add_company_member(:mike)
    |> Factory.add_company_member(:emily)
    |> delete_bindings()
  end

  #
  # In both tests, the migration is run more than once to make
  # it doesn't create a second binding and membership for people
  # who already have them.
  # If it creates a second binding, Access.get_binding/1 and
  # Access.get_group_membership/1 will throw an error.
  #

  test "Creates bindings between people and company space", ctx do
    space = Companies.get_company_space!(ctx.company.id)
    context = Access.get_context!(group_id: space.id)

    [ctx.bob, ctx.mike, ctx.emily]
    |> Enum.each(fn p ->
      group = Access.get_group!(person_id: p.id)
      refute Access.get_binding(context_id: context.id, group_id: group.id)
    end)

    Operately.Data.Change050CreateBindingsBetweenPeopleAndCompanySpace.run()
    assert_bindings_created(ctx, context)

    Operately.Data.Change050CreateBindingsBetweenPeopleAndCompanySpace.run()
    assert_bindings_created(ctx, context)
  end

  test "Creates memberships between people and company space", ctx do
    space = Companies.get_company_space!(ctx.company.id)
    group = Access.get_group!(group_id: space.id, tag: :standard)

    [ctx.bob, ctx.mike, ctx.emily]
    |> Enum.each(fn p ->
      refute Access.get_group_membership(group_id: group.id, person_id: p.id)
    end)

    Operately.Data.Change050CreateBindingsBetweenPeopleAndCompanySpace.run()
    assert_memberships_created(ctx, group)

    Operately.Data.Change050CreateBindingsBetweenPeopleAndCompanySpace.run()
    assert_memberships_created(ctx, group)
  end

  #
  # Helpers
  #

  defp assert_bindings_created(ctx, context) do
    [ctx.bob, ctx.mike, ctx.emily]
    |> Enum.each(fn p ->
      group = Access.get_group!(person_id: p.id)
      assert Access.get_binding(context_id: context.id, group_id: group.id, access_level: Access.Binding.edit_access())
    end)
  end

  defp assert_memberships_created(ctx, group) do
    [ctx.bob, ctx.mike, ctx.emily]
    |> Enum.each(fn p ->
      assert Access.get_group_membership(group_id: group.id, person_id: p.id)
    end)
  end

  defp delete_bindings(ctx) do
    space = Companies.get_company_space!(ctx.company.id)
    context = Access.get_context!(group_id: space.id)

    [ctx.bob, ctx.mike, ctx.emily]
    |> Enum.each(fn p ->
      group = Access.get_group!(person_id: p.id)
      binding = Access.get_binding!(context_id: context.id, group_id: group.id)
      Access.delete_binding(binding)
    end)

    ctx
  end
end
