defmodule Operately.Companies.Company do
  use Operately.Schema

  schema "companies" do
    has_one :access_context, Operately.Access.Context, foreign_key: :company_id

    has_many :access_groups, Operately.Access.Group, foreign_key: :company_id
    has_many :people, Operately.People.Person, foreign_key: :company_id

    field :mission, :string
    field :name, :string
    field :trusted_email_domains, {:array, :string}
    field :enabled_experimental_features, {:array, :string}, default: []
    field :company_space_id, :binary_id
    field :short_id, :integer

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  @doc false
  def changeset(company, attrs) do
    company
    |> cast(attrs, [:name, :mission, :trusted_email_domains, :enabled_experimental_features, :company_space_id, :short_id])
    |> validate_required([:name])
    |> validate_length(:name, min: 3)
  end

end
