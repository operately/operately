defmodule Operately.Projects.Retrospective do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "project_retrospectives" do
    belongs_to :author, Operately.People.Person
    belongs_to :project, Operately.Projects.Project
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList

    has_one :access_context, through: [:project, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :project_retrospective], foreign_key: :entity_id

    field :content, :map
    field :closed_at, :utc_datetime

    # populated with after load hooks
    field :permissions, :any, virtual: true

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(retrospective, attrs) do
    retrospective
    |> cast(attrs, [:author_id, :project_id, :subscription_list_id, :content, :closed_at])
    |> validate_required([:author_id, :project_id, :subscription_list_id, :content, :closed_at])
  end

  # After load hooks

  def set_permissions(retrospective = %__MODULE__{}) do
    perms = Operately.Projects.Permissions.calculate(retrospective.request_info.access_level)
    Map.put(retrospective, :permissions, perms)
  end
end
