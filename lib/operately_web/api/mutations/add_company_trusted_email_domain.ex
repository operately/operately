defmodule OperatelyWeb.Api.Mutations.AddCompanyTrustedEmailDomain do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :company_id, :string
    field :domain, :string
  end

  outputs do
    field :company, :company
  end

  def call(conn, inputs) do
    {:ok, id} = decode_company_id(inputs.company_id)

    person = me(conn)
    company = Operately.Companies.get_company!(id)
    domain = inputs.domain

    {:ok, company} = Operately.Companies.add_trusted_email_domain(company, person, domain)
    {:ok, %{company: OperatelyWeb.Api.Serializer.serialize(company)}}
  end
end
