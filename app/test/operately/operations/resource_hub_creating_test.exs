defmodule Operately.Operations.ResourceHubCreatingTest do
  use Operately.DataCase

  alias Operately.{ResourceHubs, Access}
  alias Operately.Activities.Activity
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @attrs %{
    name: "New Resource Hub",
    description: RichText.rich_text("Some description"),
    anonymous_access_level: Binding.view_access(),
    company_access_level: Binding.comment_access(),
    space_access_level: Binding.edit_access(),
  }

  test "ResourceHubCreating operation creates resource hub", ctx do
    assert length(ResourceHubs.list_resource_hubs(ctx.space)) == 1

    {:ok, resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.space, @attrs)

    hubs = ResourceHubs.list_resource_hubs(ctx.space)

    assert length(hubs) == 2
    assert Enum.find(hubs, &(&1 == resource_hub))
  end

  test "ResourceHubCreating operation does not create a dedicated access context", ctx do
    contexts_before = length(Access.list_contexts())

    {:ok, _resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.space, @attrs)

    assert length(Access.list_contexts()) == contexts_before
  end

  test "ResourceHubCreating operation does not create additional access bindings", ctx do
    bindings_before = length(Access.list_bindings())

    {:ok, _resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.space, @attrs)

    assert length(Access.list_bindings()) == bindings_before
  end

  test "ResourceHubCreating operation creates activity", ctx do
    {:ok, resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.space, @attrs)

    query = from(a in Activity, where: a.action == "resource_hub_created" and a.content["resource_hub_id"] == ^resource_hub.id)

    assert Repo.one(query)
  end
end
