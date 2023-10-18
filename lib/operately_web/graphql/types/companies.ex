defmodule OperatelyWeb.Graphql.Types.Companies do
  use Absinthe.Schema.Notation

  object :company do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :mission, non_null(:string)

    field :tenets, list_of(:tenet) do
      resolve fn company, _, _ ->
        tenets = Operately.Companies.list_tenets(company.id)

        {:ok, tenets}
      end
    end
  end
end
