defmodule OperatelyWeb.Api.Mutations.AddCompany do
  use TurboConnect.Mutation

  inputs do
    field? :company_name, :string, null: true
    field? :title, :string, null: true
    field? :is_demo, :boolean, null: true
  end

  outputs do
    field? :company, :company, null: true
  end

  def call(conn, inputs) do
    account = conn.assigns.current_account
    {:ok, company} = add_company(inputs, account)
    {:ok, %{company: OperatelyWeb.Api.Serializer.serialize(company)}}
  end

  def add_company(inputs, account) do
    if inputs[:is_demo] do
      Operately.Demo.run(account, inputs[:company_name], inputs[:title])
    else
      Operately.Operations.CompanyAdding.run(inputs, account)
    end
  end
end
