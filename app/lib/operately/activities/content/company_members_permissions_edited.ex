defmodule Operately.Activities.Content.CompanyMembersPermissionsEdited do
  use Operately.Activities.Content

  defmodule Member do
    use Operately.Activities.Content

    embedded_schema do
      belongs_to :person, Operately.People.Person
      field :previous_access_level, :integer
      field :updated_access_level, :integer
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    field :company_id, :string
    embeds_many :members, Member
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id])
    |> cast_embed(:members)
    |> validate_required([:company_id])
  end

  def build(params) do
    changeset(params)
  end
end
