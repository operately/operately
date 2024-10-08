defmodule Operately.Operations.GroupMemberRemoving do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities
  alias Operately.Groups.Member
  alias Operately.Access.Group

  def run(author, space, person_id) do
    Multi.new()
    |> delete_member(space.id, person_id)
    |> delete_access_group_memberships(space.id, person_id)
    |> delete_access_binding(space.id, person_id)
    |> insert_activity(author)
    |> Repo.transaction()
  end

  defp delete_member(multi, group_id, person_id) do
    Multi.run(multi, :member, fn repo, _ ->
      case repo.get_by(Member, group_id: group_id, person_id: person_id) do
        nil ->
          {:error, nil}
        member ->
          repo.delete(member)
          {:ok, member}
      end
    end)
  end

  defp delete_access_group_memberships(multi, group_id, person_id) do
    from(g in Group, where: g.group_id == ^group_id)
    |> Repo.all()
    |> Enum.reduce(multi, fn (access_group, multi) ->
      case Access.get_group_membership(group_id: access_group.id, person_id: person_id) do
        nil -> multi
        membership ->
          name = Atom.to_string(access_group.tag) <> "_membership_deleted"
          Multi.delete(multi, name, membership)
      end
    end)
  end

  defp delete_access_binding(multi, group_id, person_id) do
    access_group = Access.get_group!(person_id: person_id)
    access_context = Access.get_context!(group_id: group_id)
    binding = Access.get_binding!(context_id: access_context.id, group_id: access_group.id)

    Multi.delete(multi, :binding_deleted, binding)
  end

  defp insert_activity(multi, author) do
    Activities.insert_sync(multi, author.id, :space_member_removed, fn %{member: member} ->
      %{
        company_id: author.company_id,
        space_id: member.group_id,
        member_id: member.person_id,
      }
    end)
  end
end
