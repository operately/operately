defmodule Operately.Data.Change041CreateOneResourceHubForEachExistingSpaceTest do
  use Operately.DataCase

  import Operately.GroupsFixtures

  alias Operately.Access
  alias Operately.ResourceHubs.ResourceHub

  setup ctx do
    ctx
    |> Factory.setup()
  end

  test "creates one resource hubs for every existing space", ctx do
    spaces = Enum.map(1..3, fn _ ->
      group_fixture(ctx.creator)
    end)

    contexts_before = length(Access.list_contexts())

    Operately.Data.Change041CreateOneResourceHubForEachExistingSpace.run()

    Enum.each(spaces, fn s ->
      assert {:ok, _hub} = ResourceHub.get(:system, space_id: s.id)
    end)

    assert length(Access.list_contexts()) == contexts_before
  end
end
