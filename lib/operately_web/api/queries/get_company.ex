defmodule OperatelyWeb.Api.Queries.GetCompany do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Serializer
  alias Operately.Companies.ShortId
  alias Operately.Companies.Company

  inputs do
    field :id, :string
    field :include_admins, :boolean
    field :include_people, :boolean
  end

  outputs do
    field :company, :company
  end

  def call(conn, inputs) do
    case parse_id(inputs) do
      {:ok, id} ->
        person = me(conn)
        company = load(person, id, inputs)

        case company do
          nil -> {:error, :not_found}
          company -> {:ok, %{company: Serializer.serialize(company, level: :full)}}
        end
      e -> e
    end
  end

  defp parse_id(inputs) do
    if inputs[:id] == nil do
      {:error, :bad_request}
    else
      id = id_without_comments(inputs[:id])
      case ShortId.decode(id) do
        {:ok, short_id} -> {:ok, short_id}
        _ -> {:error, :bad_request}
      end
    end
  end

  defp load(person, id, inputs) do
    requested = extract_include_filters(inputs)
    query = from c in Company, join: p in assoc(c, :people), where: c.short_id == ^id and p.id == ^person.id
    query = include_requested(query, requested)

    Repo.one(query)
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_admins -> from c in q, preload: [:admins]
        :include_people -> from c in q, preload: [:people]
        _ -> raise ArgumentError, "Unknown include filter: #{inspect(include)}"
      end
    end)
  end

end
