defmodule OperatelyWeb.Api.SiteMessages.ListActive do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Access.Binding
  alias Operately.Companies.Company
  alias Operately.SiteMessages

  inputs do
  end

  outputs do
    field :messages, list_of(:site_message)
  end

  def call(conn, _inputs) do
    with {:ok, company} <- find_company(conn),
         {:ok, person} <- find_me(conn),
         {:ok, company} <- Company.get(person, id: company.id, opts: [required_access_level: Binding.minimal_access()]) do
      messages = SiteMessages.list_active_for_company(company)

      {:ok, %{messages: Serializer.serialize(messages, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :invalid_requester} -> {:error, :not_found}
    end
  end
end
