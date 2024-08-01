defmodule OperatelyWeb.Api.Mutations.AddCompany do
  use TurboConnect.Mutation

  inputs do
    field :company_name, :string

    field :full_name, :string
    field :role, :string
  end

  outputs do
    field :company, :company
  end

  def call(conn, inputs) do
    account = conn.assigns.current_account
    {:ok, company} = Operately.Operations.CompanyAdding.run(inputs, account)

    {:ok, %{company: OperatelyWeb.Api.Serializer.serialize(company)}}
  end
end
