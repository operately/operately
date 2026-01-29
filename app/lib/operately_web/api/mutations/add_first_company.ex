defmodule OperatelyWeb.Api.Mutations.AddFirstCompany do
  use TurboConnect.Mutation

  inputs do
    field? :company_name, :string, null: true
    field? :full_name, :string, null: true
    field? :email, :string, null: true
    field? :title, :string, null: true
    field? :password, :string, null: true
    field? :password_confirmation, :string, null: true
  end

  outputs do
    field? :company, :company, null: true
  end

  def call(_conn, inputs) do
    allowed = Operately.Companies.count_companies() == 0

    if allowed do
      {:ok, company} = Operately.Operations.CompanyAdding.run(inputs)
      {:ok, _} = promote_to_admin(inputs.email)
      {:ok, %{company: OperatelyWeb.Api.Serializer.serialize(company)}}
    else
      {:error, :bad_request}
    end
  end

  defp promote_to_admin(email) do
    account = Operately.People.get_account_by_email(email)
    {:ok, _} = Operately.People.Account.promote_to_admin(account)
  end
end
