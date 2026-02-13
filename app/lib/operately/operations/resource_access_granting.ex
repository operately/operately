defmodule Operately.Operations.ResourceAccessGranting do
  alias Ecto.Multi
  alias Operately.{Access, Repo}
  alias Operately.Access.Binding
  alias Operately.Access.GroupMembership
  alias Operately.Groups.Member
  alias Operately.Projects.Contributor

  def run(person_id, resources) do
    resources = deduplicate(resources)

    Multi.new()
    |> grant_resources(person_id, resources)
    |> Repo.transaction()
  end

  defp grant_resources(multi, person_id, resources) do
    resources
    |> Enum.with_index()
    |> Enum.reduce(multi, fn {resource, index}, multi ->
      grant_resource(multi, person_id, resource, index)
    end)
  end

  defp grant_resource(multi, person_id, resource, index) do
    prefix = "resource_#{index}"
    access_level = Binding.from_atom(resource.access_level)

    multi
    |> Multi.run(:"#{prefix}_context", fn _, _ ->
      {:ok, get_context(resource.resource_type, resource.resource_id)}
    end)
    |> Multi.run(:"#{prefix}_binding", fn _, changes ->
      context = changes[:"#{prefix}_context"]
      Access.bind_person(context, person_id, access_level)
    end)
    |> maybe_add_space_member(prefix, person_id, resource)
    |> maybe_add_project_contributor(prefix, person_id, resource, access_level)
  end

  defp get_context(:space, id), do: Access.get_context!(group_id: id)
  defp get_context(:goal, id), do: Access.get_context!(goal_id: id)
  defp get_context(:project, id), do: Access.get_context!(project_id: id)

  defp maybe_add_space_member(multi, prefix, person_id, %{resource_type: :space, resource_id: space_id}) do
    multi
    |> Multi.run(:"#{prefix}_space_member", fn repo, _ ->
      case repo.get_by(Member, group_id: space_id, person_id: person_id) do
        nil ->
          Member.changeset(%Member{}, %{group_id: space_id, person_id: person_id})
          |> repo.insert()

        existing ->
          {:ok, existing}
      end
    end)
    |> Multi.run(:"#{prefix}_space_membership", fn repo, _ ->
      standard_group = Access.get_group!(group_id: space_id, tag: :standard)

      case repo.get_by(GroupMembership, group_id: standard_group.id, person_id: person_id) do
        nil ->
          GroupMembership.changeset(%{
            group_id: standard_group.id,
            person_id: person_id,
          })
          |> repo.insert()

        existing ->
          {:ok, existing}
      end
    end)
  end

  defp maybe_add_space_member(multi, _prefix, _person_id, _resource), do: multi

  defp maybe_add_project_contributor(multi, prefix, person_id, %{resource_type: :project, resource_id: project_id}, access_level) do
    Multi.run(multi, :"#{prefix}_project_contributor", fn repo, _ ->
      case repo.get_by(Contributor, project_id: project_id, person_id: person_id) do
        nil ->
          Contributor.changeset(%{
            project_id: project_id,
            person_id: person_id,
            responsibility: "",
            permissions: access_level,
            role: :contributor,
          })
          |> repo.insert()

        existing ->
          {:ok, existing}
      end
    end)
  end

  defp maybe_add_project_contributor(multi, _prefix, _person_id, _resource, _access_level), do: multi

  defp deduplicate(resources) do
    resources
    |> Enum.group_by(fn r -> {r.resource_type, r.resource_id} end)
    |> Enum.map(fn {_key, entries} ->
      Enum.max_by(entries, fn r -> Binding.from_atom(r.access_level) end)
    end)
  end
end
