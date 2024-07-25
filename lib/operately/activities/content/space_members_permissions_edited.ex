defmodule Operately.Activities.Content.SpaceMembersPermissionsEdited do
  use Operately.Activities.Content

  defmodule Member do
    use Operately.Activities.Content

    embedded_schema do
      field :person_id, :string
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
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group

    embeds_many :members, Member
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id])
    |> cast_embed(:members)
    |> validate_required([:company_id, :space_id])
  end

  def build(params) do
    changeset(params)
  end
end
