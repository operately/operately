defmodule Operately.SiteMessages.SiteMessage do
  use Operately.Schema

  alias Operately.SiteMessages.SiteMessageCompany

  @fields [:title, :description, :all_companies, :active, :expires_at]

  schema "site_messages" do
    field :title, :string
    field :description, :map
    field :all_companies, :boolean, default: false
    field :active, :boolean, default: true
    field :expires_at, :utc_datetime

    has_many :site_message_companies, SiteMessageCompany
    field :company_ids, {:array, :string}, virtual: true, default: []

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(site_message, attrs) do
    site_message
    |> cast(attrs, @fields)
    |> validate_required([:title, :description, :all_companies, :active])
    |> validate_length(:title, min: 1, max: 200)
  end
end
