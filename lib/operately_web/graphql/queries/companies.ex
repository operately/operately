defmodule OperatelyWeb.GraphQL.Queries.Companies do
  use Absinthe.Schema.Notation

  object :company_queries do
    field :company, non_null(:company) do
      arg :id, non_null(:id)

      resolve fn _, args, _ ->
        company = Operately.Companies.list_companies() |> hd()

        {:ok, company}
      end
    end
  end
end
