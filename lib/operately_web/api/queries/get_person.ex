defmodule OperatelyWeb.Api.Queries.GetPerson do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :include_manager, :boolean
    field :include_reports, :boolean
    field :include_peers, :boolean
  end

  outputs do
    field :person, :person
  end

  def call(conn, inputs) do
    id = inputs[:id]
    company_id = me(conn).company_id
    include_manager = inputs[:include_manager] || nil
    include_reports = inputs[:include_reports] || nil
    include_peers = inputs[:include_peers] || nil

    case load(id, company_id, include_manager, include_reports, include_peers) do
      {person, peers} ->
        {:ok, %{person: serialize(person, peers, include_manager, include_reports, include_peers)}}
      nil ->
        {:error, :not_found}
    end
  end

  defp load(id, company_id, include_manager, include_reports, include_peers) do
    query = from p in Operately.People.Person, where: p.id == ^id and p.company_id == ^company_id
    query = extend_query(query, include_manager, fn q -> from q, preload: [:manager] end)
    query = extend_query(query, include_reports, fn q -> from q, preload: [:reports] end)

    person = Repo.one(query)

    if person do
      if include_peers do
        {person, Operately.People.get_peers(person)}
      else
        {person, nil}
      end
    else
      nil
    end
  end

  defp serialize(person, peers, include_manager, include_reports, include_peers) do
    serialize_basic(person)
    |> Map.merge(%{theme: person.theme || "system"})
    |> extend_map_if(include_manager, fn -> %{manager: serialize_basic(person.manager)} end)
    |> extend_map_if(include_reports, fn -> %{reports: serialize_basic(person.reports)} end)
    |> extend_map_if(include_peers, fn -> %{peers: serialize_basic(peers)} end)
  end

  defp serialize_basic(people) when is_list(people) do
    Enum.map(people, fn p -> serialize_basic(p) end)
  end

  defp serialize_basic(nil), do: nil
  defp serialize_basic(person) do
    %{
      id: person.id,
      full_name: person.full_name,
      email: person.email,
      avatar_url: person.avatar_url,
      title: person.title,
      manager_id: person.manager_id,
      suspended: person.suspended
    }
  end
end
