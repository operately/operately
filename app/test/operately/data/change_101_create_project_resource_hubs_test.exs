defmodule Operately.Data.Change101CreateProjectResourceHubsTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Data.Change101CreateProjectResourceHubs
  alias Operately.Support.Factory

  import Operately.ResourceHubsFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  test "preserves custom space resource hub access", ctx do
    custom_hub =
      resource_hub_fixture(ctx.creator, ctx.space, %{
        name: "Custom Hub",
        anonymous_access_level: Binding.no_access(),
        company_access_level: Binding.no_access(),
        space_access_level: Binding.full_access()
      })

    custom_hub_context = Access.get_context!(resource_hub_id: custom_hub.id)
    before_bindings = binding_snapshot(custom_hub_context.id)

    Change101CreateProjectResourceHubs.run()

    assert binding_snapshot(custom_hub_context.id) == before_bindings
  end

  defp binding_snapshot(context_id) do
    Access.list_bindings()
    |> Enum.filter(&(&1.context_id == context_id))
    |> Enum.map(&{&1.group_id, &1.access_level, &1.tag})
    |> Enum.sort()
  end
end
