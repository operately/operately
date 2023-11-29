defmodule Operately.Companies.Company do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "companies" do
    field :mission, :string
    field :name, :string
    field :trusted_email_domains, {:array, :string}

    timestamps()
  end

  @doc false
  def changeset(company, attrs) do
    company
    |> cast(attrs, [:name, :mission, :trusted_email_domains])
    |> validate_required([:name, :mission])
  end
end
