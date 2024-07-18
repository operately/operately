defmodule OperatelyWeb.Api.Queries.GetSpace do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Repo
  alias Operately.Groups.Group

  import Ecto.Query, only: [from: 2]

  inputs do
    field :id, :string
    field :include_members, :boolean
    field :include_access_levels, :boolean
    field :include_members_access_levels, :boolean
  end

  outputs do
    field :space, :space
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs[:id])
    space = load(id, me(conn), inputs)

    if space do
      {:ok, %{space: Serializer.serialize(space, level: :full)}}
    else
      {:error, :not_found}
    end
  end

  defp load(id, person, inputs) do
    requested = extract_include_filters(inputs)

    (from s in Group, where: s.id == ^id, preload: [:company])
    |> Group.scope_company(person.company_id)
    |> include_requested(requested)
    |> load_members_access_level(inputs[:include_members_access_levels], id)
    |> Repo.one()
    |> preload_is_member(person)
    |> sort_members()
    |> load_access_levels(inputs[:include_access_levels])
  end

  defp include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_members -> from p in q, preload: [:members]
        :include_access_levels -> q # this is done after the load
        :include_members_access_levels -> q # this is done in a separate function
        e -> raise "Unknown include filter: #{inspect e}"
      end
    end)
  end

  defp preload_is_member(nil, _), do: nil
  defp preload_is_member(space, person), do: Group.load_is_member(space, person)

  defp sort_members(group) when is_list(group.members) do
    %{group | members: Enum.sort_by(group.members, & &1.full_name) }
  end
  defp sort_members(group), do: group

  defp load_access_levels(nil, _), do: nil
  defp load_access_levels(group, true), do: Group.preload_access_levels(group)
  defp load_access_levels(group, _), do: group

  defp load_members_access_level(query, true, space_id), do: Group.preload_members_access_level(query, space_id)
  defp load_members_access_level(query, _, _), do: query
end
