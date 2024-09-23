defmodule Operately.Projects.Retrospective do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "project_retrospectives" do
    belongs_to :author, Operately.People.Person
    belongs_to :project, Operately.Projects.Project
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList

    has_one :access_context, through: [:project, :access_context]

    field :content, :map
    field :closed_at, :utc_datetime

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
    |> validate_required([:author_id, :project_id, :content, :closed_at])
  end
end
