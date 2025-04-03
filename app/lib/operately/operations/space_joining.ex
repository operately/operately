defmodule Operately.Operations.SpaceJoining do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Groups.Member
  alias Operately.Access
  alias Operately.Access.{GroupMembership, Binding}

  def run(author, space_id) do
    Multi.new()
    |> insert_member(author.id, space_id)
    |> insert_access_group_membership(author.id, space_id)
    |> insert_access_binding(author.id, space_id)
    |> insert_activity(author, space_id)
    |> Repo.transaction()
    |> Repo.extract_result(:member)
  end

  defp insert_member(multi, author_id, space_id) do
    Multi.insert(multi, :member, Member.changeset(%{
      person_id: author_id,
      group_id: space_id,
    }))
  end

  defp insert_access_group_membership(multi, author_id, space_id) do
    access_group = Access.get_group!(group_id: space_id, tag: :standard)

    Multi.insert(multi, :group_membership, GroupMembership.changeset(%{
      group_id: access_group.id,
      person_id: author_id,
    }))
  end

  defp insert_access_binding(multi, author_id, space_id) do
    access_group = Access.get_group!(person_id: author_id)
    access_context = Access.get_context!(group_id: space_id)

    Multi.insert(multi, :binding, Binding.changeset(%{
      group_id: access_group.id,
      context_id: access_context.id,
      access_level: Binding.view_access(),
    }))
  end

  defp insert_activity(multi, author, space_id) do
    Activities.insert_sync(multi, author.id, :space_joining, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: space_id
      }
    end)
  end
end
