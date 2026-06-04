defmodule Operately.ResourceHubs.SpaceHub do
  import Ecto.Query, only: [from: 2]

  alias Operately.Access
  alias Operately.Access.{Binding, Context}
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub

  def sync_access_from_space(space_id) do
    from(h in ResourceHub, where: h.space_id == ^space_id)
    |> Repo.all()
    |> Enum.each(&sync_access_from_hub!/1)

    {:ok, :synced}
  end

  def sync_access_from_hub!(%ResourceHub{} = hub) do
    with %Context{} = space_context <- Access.get_context(group_id: hub.space_id),
         %Context{} = hub_context <- get_or_create_context!(hub) do
      copy_bindings(space_context, hub_context)
    end
  end

  defp get_or_create_context!(hub) do
    case Access.get_context(resource_hub_id: hub.id) do
      nil ->
        {:ok, context} = Access.create_context(%{resource_hub_id: hub.id})
        context

      context ->
        context
    end
  end

  defp copy_bindings(source_context, hub_context) do
    Repo.delete_all(from(b in Binding, where: b.context_id == ^hub_context.id))

    from(b in Binding, where: b.context_id == ^source_context.id)
    |> Repo.all()
    |> Enum.each(fn binding ->
      Binding.changeset(%{
        context_id: hub_context.id,
        group_id: binding.group_id,
        access_level: binding.access_level,
        tag: binding.tag
      })
      |> Repo.insert!()
    end)

    hub_context
  end
end
