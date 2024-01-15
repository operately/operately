defmodule OperatelyWeb.Graphql.Types.Companies do
  use Absinthe.Schema.Notation

  object :company do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :mission, non_null(:string)
    field :trusted_email_domains, list_of(:string)
    field :enabled_experimental_features, list_of(:string)
    field :company_space_id, :string

    field :tenets, list_of(:tenet) do
      resolve fn company, _, _ ->
        tenets = Operately.Companies.list_tenets(company.id)

        {:ok, tenets}
      end
    end

    field :admins, list_of(:person) do
      resolve fn company, _, _ ->
        admins = Operately.Companies.list_admins(company.id)

        {:ok, admins}
      end
    end

    field :people, list_of(:person) do
      resolve fn company, _, _ ->
        people = Operately.People.list_people(company.id)

        {:ok, people}
      end
    end
    
  end
end
