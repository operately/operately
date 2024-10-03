defmodule Operately.Operations.GroupCancellation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Groups
  alias Operately.Groups.{Group, Member}
  alias Operately.Access
  alias Operately.Access.{Binding, GroupMembership}

  def run(canceller, group_id, reason) do
    group = Repo.get!(Group, group_id)

    Multi.new()
    |> update_group(group, reason)
    |> remove_members(group)
    |> remove_access_bindings(group)
    |> insert_activity(canceller, group, reason)
    |> Repo.transaction()
    |> Repo.extract_result(:group)
  end

  defp update_group(multi, group, reason) do
    Multi.update(multi, :group, Group.cancellation_changeset(group, %{
      cancelled_at: DateTime.utc_now(),
      cancellation_reason: reason
    }))
  end

  defp remove_members(multi, group) do
    Multi.delete_all(multi, :remove_members, fn _ ->
      from(m in Member, where: m.group_id == ^group.id)
    end)
  end

  defp remove_access_bindings(multi, group) do
    Multi.run(multi, :remove_bindings, fn _repo, _changes ->
      {count, nil} = Access.delete_all_bindings(group)
      {:ok, count}
    end)
  end

  defp insert_activity(multi, canceller, group, reason) do
    Activities.insert_sync(multi, canceller.id, :space_cancelled, fn _ ->
      %{
        company_id: group.company_id,
        space_id: group.id,
        name: group.name,
        canceller_id: canceller.id,
        cancellation_reason: reason
      }
    end)
  end
end
