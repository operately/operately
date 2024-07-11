defmodule Operately.Operations.GroupPermissionsEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities

  def run(author, space, attrs) do
    Multi.new()
    |> Multi.run(:context, fn _, _ ->
      {:ok, Access.get_context!(group_id: space.id)}
    end)
    |> Access.update_bindings_to_company(space.company_id, attrs.company, attrs.public)
    |> insert_activity(author, space)
    |> Repo.transaction()
  end

  defp insert_activity(multi, author, space) do
    Activities.insert_sync(multi, author.id, :space_permissions_edited, fn changes ->
      %{
        company_id: space.company_id,
        space_id: space.id,
        previous_permissions: %{
          public: find_access_level(changes, :anonymous_binding, :previous),
          company: find_access_level(changes, :company_members_binding, :previous),
        },
        new_permissions: %{
          public: find_access_level(changes, :anonymous_binding, :updated),
          company: find_access_level(changes, :company_members_binding, :updated),
        }
      }
    end)
  end

  defp find_access_level(changes, level, version) do
    case Map.has_key?(changes, level) do
      true -> Map.get(changes[level], version).access_level
      false -> nil
    end
  end
end
