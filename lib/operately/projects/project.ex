defmodule Operately.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "projects" do
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :objective, Operately.Okrs.Objective, foreign_key: :objective_id

    has_many :contributors, Operately.Projects.Contributor, foreign_key: :project_id

    field :description, :map
    field :name, :string

    field :started_at, :utc_datetime
    field :deadline, :utc_datetime
    field :next_update_scheduled_at, :utc_datetime
    field :phase, Ecto.Enum, values: [:concept, :planning, :execution, :control], default: :concept

    # related documents
    belongs_to :pitch, Operately.Projects.Document, foreign_key: :pitch_document_id
    belongs_to :plan, Operately.Projects.Document, foreign_key: :plan_document_id
    belongs_to :execution_review, Operately.Projects.Document, foreign_key: :execution_review_document_id
    belongs_to :control_review, Operately.Projects.Document, foreign_key: :control_review_document_id
    belongs_to :retrospective, Operately.Projects.Document, foreign_key: :retrospective_document_id

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [
      :name,
      :description,
      :group_id,
      :started_at,
      :deadline,
      :objective_id,
      :next_update_scheduled_at,
      :phase,
      :pitch_document_id,
      :plan_document_id,
      :execution_review_document_id,
      :control_review_document_id,
      :retrospective_document_id
    ])
    |> validate_required([:name])
  end
end
