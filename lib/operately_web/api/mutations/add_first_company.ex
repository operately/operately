defmodule OperatelyWeb.Api.Mutations.AddFirstCompany do
  use TurboConnect.Mutation

  inputs do
    field :company_name, :string
    field :full_name, :string
    field :email, :string
    field :role, :string
    field :password, :string
    field :password_confirmation, :string
  end

  outputs do
    field :company, :company
  end

  def call(_conn, inputs) do
    allowed = Operately.Companies.count_companies() == 0

    if allowed do
      {:ok, company} = Operately.Operations.CompanyAdding.run(inputs, create_admin: true)
      {:ok, %{company: OperatelyWeb.Api.Serializer.serialize(company)}}
    else
      {:error, :bad_request}
    end
  end
end
