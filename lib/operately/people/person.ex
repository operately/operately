defmodule Operately.People.Person do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "people" do
    belongs_to(:account, Operately.Accounts.Account)
    belongs_to(:company, Operately.Companies.Company)
    belongs_to(:home_dashboard, Operately.Dashboards.Dashboard)

    field :full_name, :string
    field :handle, :string
    field :title, :string
    field :avatar_url, :string
    field :email, :string

    timestamps()
  end

  @doc false
  def changeset(person, attrs) do
    person
    |> cast(attrs, [:full_name, :handle, :title, :avatar_url, :email, :account_id, :company_id])
    |> validate_required([:full_name, :company_id])
    |> unique_constraint(:handle)
  end
end
