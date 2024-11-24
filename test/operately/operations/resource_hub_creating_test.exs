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

  test "ResourceHubCreating operation creates context", ctx do
    {:ok, resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.space, @attrs)

    assert Access.get_context(resource_hub_id: resource_hub.id)
  end

  test "ResourceHubCreating operation creates bindings to company", ctx do
    {:ok, resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.space, @attrs)

    context = Access.get_context!(resource_hub_id: resource_hub.id)

    full_access = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
    members = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    anonymous = Access.get_group!(company_id: ctx.company.id, tag: :anonymous)

    assert Access.get_binding(group_id: full_access.id, context_id: context.id, access_level: Binding.full_access())
    assert Access.get_binding(group_id: members.id, context_id: context.id, access_level: Binding.comment_access())
    assert Access.get_binding(group_id: anonymous.id, context_id: context.id, access_level: Binding.view_access())
  end

  test "ResourceHubCreating operation creates bindings to space", ctx do
    {:ok, resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.space, @attrs)

    context = Access.get_context!(resource_hub_id: resource_hub.id)
    full_access = Access.get_group!(group_id: ctx.space.id, tag: :full_access)
    members = Access.get_group!(group_id: ctx.space.id, tag: :standard)

    assert Access.get_binding(group_id: full_access.id, context_id: context.id, access_level: Binding.full_access())
    assert Access.get_binding(group_id: members.id, context_id: context.id, access_level: Binding.edit_access())
  end

  test "ResourceHubCreating operation creates activity", ctx do
    {:ok, resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.space, @attrs)

    query = from(a in Activity, where: a.action == "resource_hub_created" and a.content["resource_hub_id"] == ^resource_hub.id)

    assert Repo.one(query)
  end
end
