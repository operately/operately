defmodule OperatelyWeb.Api.Queries.GetPerson do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.People.Person

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
    case load(inputs[:id], me(conn).company_id, inputs) do
      nil -> {:error, :not_found}
      person -> {:ok, %{person: Serializer.serialize(person, level: :full)}}
    end
  end

  defp load(id, company_id, inputs) do
    requested = extract_include_filters(inputs)

    (from p in Person, where: p.id == ^id)
    |> Person.scope_company(company_id)
    |> include_requested(requested)
    |> Repo.one()
    |> preload_peers(inputs[:include_peers])
  end

  defp include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_manager -> from p in q, preload: [:manager]
        :include_reports -> from p in q, preload: [:reports]
        :include_peers -> q # this is done after the load
        _ -> raise "Unknown include filter: #{inspect(include)}"
      end
    end)
  end

  defp preload_peers(nil, _), do: nil
  defp preload_peers(person, true), do: Person.preload_peers(person)
  defp preload_peers(person, nil), do: person
end
