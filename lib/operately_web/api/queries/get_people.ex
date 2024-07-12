defmodule OperatelyWeb.Api.Queries.GetPeople do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :include_suspended, :boolean
    field :include_manager, :boolean
  end

  outputs do
    field :people, list_of(:person)
  end

  def call(conn, inputs) do
    company_id = me(conn).company_id
    people = load_people(company_id, inputs)

    {:ok, %{people: Serializer.serialize(people, level: :full)}}
  end

  defp load_people(company_id, inputs) do
    requested = extract_include_filters(inputs)

    query = from p in Operately.People.Person, where: p.company_id == ^company_id
    query = if inputs[:include_suspended] do 
      query
    else 
      from p in query, where: not p.suspended
    end
    query = include_requested(query, requested)
    query = from p in query, order_by: [asc: p.full_name]

    Repo.all(query)
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_suspended -> q
        :include_manager -> from p in q, preload: [:manager]
        _ -> raise ArgumentError, "Unknown include filter: #{inspect(include)}"
      end
    end)
  end
end
