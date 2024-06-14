defmodule Operately.Data.Change010CreateGroupsAccessContext do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Groups.Group
  alias Operately.Access.Context

  def run do
    Repo.transaction(fn ->
      groups = Repo.all(from g in Group, select: g.id)

      Enum.each(groups, fn group_id ->
        case create_group_access_contexts(group_id) do
          {:error, _} -> raise "Failed to create access context"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_group_access_contexts(group_id) do
    existing_context = Repo.one(from c in Context, where: c.group_id == ^group_id, select: c.id)

    if existing_context do
      :ok
    else
      Access.create_context(%{group_id: group_id})
    end
  end
end
