defmodule OperatelyWeb.Api.Mutations.AddGroupMembers do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :group_id, :string
    field :members, list_of(:add_member_input)
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.group_id)
    
    case check_permissions(me(conn), id) do
      {:error, reason} ->
        {:error, reason}

      :ok ->
        Operately.Operations.GroupMembersAdding.run(me(conn), id, inputs.members)
        {:ok, %{}}
    end
  end

  defp check_permissions(person, space_id) do
    query = from(s in Operately.Groups.Group, where: s.id == ^space_id)
    has_permissions = filter_by_full_access(query, person.id) |> Repo.exists?()

    if has_permissions do
      :ok
    else
      forbidden_or_not_found(query, person.id)
    end
  end
end
