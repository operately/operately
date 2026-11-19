defmodule Operately.Groups.GroupTest do
  use Operately.DataCase

  alias Operately.Groups.Group
  alias Operately.Support.Factory

  test "collection enrichment raises when a space has no access context", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space)
    context = Operately.Access.get_context!(group_id: ctx.space.id)
    Repo.delete!(context)

    assert_raise Ecto.NoResultsError, fn -> Group.preload_access_levels([ctx.space]) end
  end
end
