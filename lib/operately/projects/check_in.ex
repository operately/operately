defmodule Operately.Projects.CheckIn do
  use Operately.Schema

  schema "project_check_ins" do
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id, where: [deleted_at: nil]
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

    field :status, :string
    field :description, :map

    belongs_to :acknowledged_by, Operately.People.Person, foreign_key: :acknowledged_by_id
    field :acknowledged_at, :utc_datetime

    has_one :access_context, through: [:project, :access_context]
    has_many :reactions, Operately.Updates.Reaction, foreign_key: :entity_id, where: [entity_type: :project_check_in]
    has_many :comments, Operately.Updates.Comment, foreign_key: :entity_id, where: [entity_type: :project_check_in]

    timestamps()
    requester_access_level()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [:author_id, :project_id, :description, :status, :acknowledged_by_id, :acknowledged_at, :subscription_list_id])
    |> validate_required([:author_id, :project_id, :description, :status, :subscription_list_id])
  end
end
