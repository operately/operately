defmodule Operately.Activities.Content.SpacePermissionsEdited do
  use Operately.Activities.Content

  defmodule Permissions do
    use Operately.Activities.Content

    embedded_schema do
      field :public, :integer
      field :company, :integer
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, [:public, :company])
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group

    embeds_one :previous_permissions, Permissions
    embeds_one :new_permissions, Permissions
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id])
    |> cast_embed(:previous_permissions)
    |> cast_embed(:new_permissions)
    |> validate_required([:company_id, :space_id, :previous_permissions, :new_permissions])
  end

  def build(params) do
    changeset(params)
  end
end
