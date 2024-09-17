defmodule Operately.Support.Factory.Spaces do
  alias Operately.Support.Factory.Utils

  def add_space(ctx, testid, opts \\ []) do
    name = Keyword.get(opts, :name, "Product Space")
    space = Operately.GroupsFixtures.group_fixture(ctx.creator, %{name: name})

    Map.put(ctx, testid, space)
  end

  def add_space_member(ctx, testid, space_name, opts \\ []) do
    space = Map.fetch!(ctx, space_name)

    name = Keyword.get(opts, :name, Utils.testid_to_name(testid))
    level = Keyword.get(opts, :permissions, :edit_access)

    person  = Operately.PeopleFixtures.person_fixture_with_account(%{company_id: ctx.company.id, full_name: name})

    {:ok, _} = Operately.Groups.add_members(person, space.id, [%{
      id: person.id,
      permissions: Operately.Access.Binding.from_atom(level)
    }])

    Map.put(ctx, testid, person)
  end

end
