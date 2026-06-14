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
    |> Factory.add_project(:project, :space)
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

  test "ResourceHubCreating operation creates a project-backed resource hub", ctx do
    hubs_before = ResourceHubs.list_resource_hubs(ctx.project)

    {:ok, resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.project, @attrs)

    hubs_after = ResourceHubs.list_resource_hubs(ctx.project)

    assert length(hubs_after) == length(hubs_before) + 1
    assert Enum.find(hubs_after, &(&1 == resource_hub))
    assert resource_hub.project_id == ctx.project.id
    assert is_nil(resource_hub.space_id)
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

    activity = get_activity(resource_hub)

    assert activity.access_context == Access.get_context!(group_id: ctx.space.id)
    assert activity.content["space_id"] == ctx.space.id
    assert activity.content["project_id"] == nil
  end

  test "ResourceHubCreating operation assigns the project context for project-backed hubs", ctx do
    {:ok, resource_hub} = Operately.Operations.ResourceHubCreating.run(ctx.creator, ctx.project, @attrs)

    activity = get_activity(resource_hub)

    assert activity.access_context == Access.get_context!(project_id: ctx.project.id)
    assert activity.content["space_id"] == ctx.space.id
    assert activity.content["project_id"] == ctx.project.id
  end

  defp get_activity(resource_hub) do
    from(a in Activity, where: a.action == "resource_hub_created" and a.content["resource_hub_id"] == ^resource_hub.id)
    |> Repo.one()
    |> Repo.preload(:access_context)
  end
end
