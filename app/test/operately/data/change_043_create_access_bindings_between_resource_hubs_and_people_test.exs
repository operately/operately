defmodule Operately.Data.Change043CreateAccessBindingsBetweenResourceHubsAndPeopleTest do
  use Operately.DataCase

  import Operately.GroupsFixtures

  alias Operately.Access
  alias Operately.ResourceHubs.ResourceHub

  setup ctx do
    ctx
    |> Factory.setup()
    |> setup_resource_hubs()
  end

  test "creates bindings to exising resource hubs contexts", ctx do
    company_full = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
    company_standard = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    Enum.each(ctx.hubs, fn hub ->
      context = Access.get_context!(resource_hub_id: hub.id)
      space_full = Access.get_group!(group_id: hub.space_id, tag: :full_access)
      space_standard =Access.get_group!(group_id: hub.space_id, tag: :standard)

      refute Access.get_binding(context_id: context.id, group_id: company_full.id)
      refute Access.get_binding(context_id: context.id, group_id: company_standard.id)
      refute Access.get_binding(context_id: context.id, group_id: space_full.id)
      refute Access.get_binding(context_id: context.id, group_id: space_standard.id)
    end)

    Operately.Data.Change043CreateAccessBindingsBetweenResourceHubsAndPeople.run()

    Enum.each(ctx.hubs, fn hub ->
      context = Access.get_context!(resource_hub_id: hub.id)
      space_full = Access.get_group!(group_id: hub.space_id, tag: :full_access)
      space_standard =Access.get_group!(group_id: hub.space_id, tag: :standard)

      assert Access.get_binding(context_id: context.id, group_id: company_full.id)
      assert Access.get_binding(context_id: context.id, group_id: company_standard.id)
      assert Access.get_binding(context_id: context.id, group_id: space_full.id)
      assert Access.get_binding(context_id: context.id, group_id: space_standard.id)
    end)
  end

  #
  # Helpers
  #

  defp setup_resource_hubs(ctx) do
    spaces = Enum.map(1..3, fn _ ->
      group_fixture(ctx.creator)
    end)

    hubs = Enum.map(spaces, fn s ->
      {:ok, hub} = ResourceHub.changeset(%{
        space_id: s.id,
        name: "Resource Hub",
      })
      |> Repo.insert()

      {:ok, _} = Access.create_context(%{resource_hub_id: hub.id})

      hub
    end)

    ctx
    |> Map.put(:hubs, hubs)
  end
end
