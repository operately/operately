defmodule Operately.Access.Group do
  use Operately.Schema

  schema "access_groups" do
    belongs_to :person, Operately.People.Person, foreign_key: :person_id
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id

    has_many :memberships, Operately.Access.GroupMembership, foreign_key: :group_id
    has_many :bindings, Operately.Access.Binding, foreign_key: :group_id

    field :tag, Ecto.Enum, values: [:full_access, :standard]

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(group, attrs) do
    group
    |> cast(attrs, [:person_id, :company_id, :group_id, :tag])
    |> validate_one_association()
    |> validate_required([])
  end

  defp validate_one_association(changeset) do
    fields = [:person_id, :company_id]
    count = Enum.count(fields, fn field -> get_field(changeset, field) != nil end)

    if count <= 1 do
      changeset
    else
      add_error(changeset, :base, "Only one association (Person, Company or Group) may be set.")
    end
  end
end
