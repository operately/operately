defmodule OperatelyWeb.GraphQL.Types.Person do
  use Absinthe.Schema.Notation

  object :person do
    field :id, non_null(:id)
    field :full_name, non_null(:string)
    field :title, :string
    field :avatar_url, :string

    field :company, non_null(:company) do
      resolve fn person, _, _  ->
        company = Operately.Companies.get_company!(person.company_id)

        {:ok, company}
      end
    end

    field :pins, list_of(:pin) do
      resolve fn person, _, _ ->
        pins = Operately.People.list_pins(person.id)

        {:ok, pins}
      end
    end
  end

  union :pin do
    types [:project]

    resolve_type fn
      %{type: type} -> type
    end
  end
end
