defmodule Operately.Operations.ResourceHubCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.{Access, Activities}
  alias Operately.Access.{Context, Binding}
  alias Operately.ResourceHubs.ResourceHub

  def run(author, space, attrs) do
    Multi.new()
    |> Multi.insert(:resource_hub, ResourceHub.changeset(%{
      space_id: space.id,
      name: attrs.name,
      description: attrs.description,
    }))
    |> Multi.insert(:context, fn changes ->
      Context.changeset(%{
        resource_hub_id: changes.resource_hub.id,
      })
    end)
    |> insert_bindings(space, attrs)
    |> Activities.insert_sync(author.id, :resource_hub_created, fn changes ->
      %{
        space_id: space.id,
        company_id: space.company_id,
        resource_hub_id: changes.resource_hub.id,
        name: changes.resource_hub.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:resource_hub)
  end

  defp insert_bindings(multi, space, attrs) do
    full_access = Access.get_group!(company_id: space.company_id, tag: :full_access)
    standard = Access.get_group!(company_id: space.company_id, tag: :standard)
    space_full_access = Access.get_group!(group_id: space.id, tag: :full_access)
    space_standard = Access.get_group!(group_id: space.id, tag: :standard)

    multi
    |> Access.maybe_insert_anonymous_binding(space.company_id, attrs.anonymous_access_level)
    |> Access.insert_binding(:company_full_access_binding, full_access, Binding.full_access())
    |> Access.insert_binding(:company_members_binding, standard, attrs.company_access_level)
    |> Access.insert_binding(:space_full_access_binding, space_full_access, Binding.full_access())
    |> Access.insert_binding(:space_members_binding, space_standard, attrs.space_access_level)
  end
end
