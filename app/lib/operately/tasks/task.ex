defmodule Operately.Tasks.Task do
  use Operately.Schema
  use Operately.Repo.Getter

  @type t :: %__MODULE__{
          id: Ecto.UUID.t() | nil,
          name: String.t() | nil,
          priority: String.t() | nil,
          size: String.t() | nil,
          description: map() | nil,
          due_date: %Operately.ContextualDates.ContextualDate{} | nil,
          status: String.t(),
          closed_at: NaiveDateTime.t() | nil,
          reopened_at: NaiveDateTime.t() | nil,
          creator_id: Ecto.UUID.t() | nil,
          milestone_id: Ecto.UUID.t() | nil,
          project_id: Ecto.UUID.t() | nil,
          permissions: map() | nil,
          inserted_at: NaiveDateTime.t() | nil,
          updated_at: NaiveDateTime.t() | nil
        }

  schema "tasks" do
    belongs_to :creator, Operately.People.Person
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :project, Operately.Projects.Project
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :group, through: [:project, :group]
    has_one :company, through: [:creator, :company]
    has_one :access_context, through: [:project, :access_context]

    has_many :assignees, Operately.Tasks.Assignee
    has_many :assigned_people, through: [:assignees, :person]

    has_many :comments, Operately.Updates.Comment, where: [entity_type: :project_task], foreign_key: :entity_id

    field :name, :string
    field :priority, :string
    field :size, :string
    field :description, :map

    field :deprecated_due_date, :naive_datetime
    embeds_one :due_date, Operately.ContextualDates.ContextualDate, on_replace: :update

    field :status, :string, default: "todo"
    field :closed_at, :naive_datetime
    field :reopened_at, :naive_datetime

    # populated with after load hooks
    field :permissions, :any, virtual: true

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(task, attrs) do
    task
    |> cast(attrs, [
      :name,
      :deprecated_due_date,
      :description,
      :size,
      :priority,
      :creator_id,
      :status,
      :closed_at,
      :reopened_at,
      :milestone_id,
      :project_id,
      :subscription_list_id
    ])
    |> cast_embed(:due_date)
    |> validate_required([:name, :description, :creator_id, :project_id, :subscription_list_id])
  end

  #
  # Scopes
  #

  import Ecto.Query, only: [from: 2]

  def scope_company(query, company_id) do
    from t in query, join: c in assoc(t, :company), where: c.id == ^company_id
  end

  def scope_milestone(query, milestone_id) do
    from t in query, where: t.milestone_id == ^milestone_id
  end

  #
  # After load hooks
  #

  def set_permissions(task = %__MODULE__{}) do
    perms = Operately.Projects.Permissions.calculate(task.request_info.access_level)
    Map.put(task, :permissions, perms)
  end
end
