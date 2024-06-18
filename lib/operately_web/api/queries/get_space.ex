defmodule OperatelyWeb.Api.Queries.GetSpace do
  use TurboConnect.Query

  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Groups.Group

  import Ecto.Query, only: [from: 2]

  inputs do
    field :id, :string
    field :include_members, :boolean
  end

  outputs do
    field :space, :space
  end

  def call(conn, inputs) do
    me = conn.assigns.current_account.person
    space = load(inputs.id)

    if space do
      members = load_members(space, inputs[:include_members])
      is_member = Groups.is_member?(space, me)

      {:ok, serialize(space, members, is_member)}
    else
      {:error, :not_found}
    end
  end

  defp load(id) do
    (from s in Group, where: s.id == ^id, preload: [:company]) |> Repo.one() 
  end

  defp load_members(space, true), do: Groups.list_members(space)
  defp load_members(_space, _), do: nil

  defp serialize(space, members, is_member) do
    %{
      space: %{
        id: space.id,
        name: space.name,
        mission: space.mission,
        icon: space.icon,
        color: space.color,
        is_company_space: space.company.company_space_id == space.id,
        is_member: is_member,
        members: members && Enum.map(members, &serialize_member/1)
      }
    }
  end

  defp serialize_member(member = %Operately.People.Person{}) do
    %{
      id: member.id,
      full_name: member.full_name,
      avatar_url: member.avatar_url,
      title: member.title,
    }
  end
end
