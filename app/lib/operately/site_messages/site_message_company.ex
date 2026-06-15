defmodule Operately.SiteMessages.SiteMessageCompany do
  use Operately.Schema

  alias Operately.Companies.Company
  alias Operately.SiteMessages.SiteMessage

  schema "site_message_companies" do
    belongs_to :site_message, SiteMessage
    belongs_to :company, Company
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(site_message_company, attrs) do
    site_message_company
    |> cast(attrs, [:site_message_id, :company_id])
    |> validate_required([:site_message_id, :company_id])
    |> unique_constraint([:site_message_id, :company_id])
  end
end
