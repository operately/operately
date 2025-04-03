defmodule Operately.Data.Change043CreateAccessBindingsBetweenResourceHubsAndPeople do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding

  def run do
    Repo.transaction(fn ->
      from(h in Operately.ResourceHubs.ResourceHub, preload: :space, select: h)
      |> Repo.all()
      |> create_bindings()
    end)
  end

  defp create_bindings(hubs) when is_list(hubs) do
    Enum.each(hubs, &(create_bindings(&1)))
  end

  defp create_bindings(hub) do
    context = Access.get_context!(resource_hub_id: hub.id)

    company_full = Access.get_group!(company_id: hub.space.company_id, tag: :full_access)
    space_full = Access.get_group!(group_id: hub.space.id, tag: :full_access)
    company_standard = Access.get_group!(company_id: hub.space.company_id, tag: :standard)
    space_standard =Access.get_group!(group_id: hub.space.id, tag: :standard)

    create_binding(context, company_full, Binding.full_access())
    create_binding(context, space_full, Binding.full_access())
    create_binding(context, company_standard, Binding.comment_access())
    create_binding(context, space_standard, Binding.comment_access())
  end

  defp create_binding(context, group, access_level) do
    case Access.get_binding(context_id: context.id, group_id: group.id) do
      nil ->
        {:ok, _} = Access.create_binding(%{
          group_id: group.id,
          context_id: context.id,
          access_level: access_level,
        })
      _ -> :ok
    end
  end
end
