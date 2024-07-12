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
    query = from p in Operately.People.Person, where: p.company_id == ^company_id

    query = if inputs[:include_suspended] do 
      query
    else 
      from p in query, where: is_nil(p.suspended_at)
    end

    query = if inputs[:include_manager] do
      from p in query, preload: [:manager]
    else
      query
    end

    query = from p in query, order_by: [asc: p.full_name]

    Repo.all(query)
  end
end
