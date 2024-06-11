defmodule Operately.Access.Context do
  use Operately.Schema

  schema "access_contexts" do
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id

    has_many :activities, Operately.Activities.Activity, foreign_key: :context_id

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(context, attrs) do
    context
    |> cast(attrs, [:project_id, :group_id])
    |> validate_one_association
    |> validate_required([])
  end

  defp validate_one_association(changeset) do
    fields = [:project_id, :group_id]
    count = Enum.count(fields, fn field -> get_field(changeset, field) != nil end)

    if count == 1 do
      changeset
    else
      add_error(changeset, :base, "Exactly one association (Project, Group or Company) must be set.")
    end
  end
end
