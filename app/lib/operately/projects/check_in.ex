defmodule Operately.Projects.CheckIn do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  @valid_statuses [:on_track, :caution, :off_track]

  schema "project_check_ins" do
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id, where: [deleted_at: nil]
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    field :status, Ecto.Enum, values: @valid_statuses
    field :description, :map

    belongs_to :acknowledged_by, Operately.People.Person, foreign_key: :acknowledged_by_id
    field :acknowledged_at, :utc_datetime

    has_one :access_context, through: [:project, :access_context]
    has_many :reactions, Operately.Updates.Reaction, foreign_key: :entity_id, where: [entity_type: :project_check_in]
    has_many :comments, Operately.Updates.Comment, foreign_key: :entity_id, where: [entity_type: :project_check_in]

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :notifications, :any, virtual: true, default: []
    field :comment_count, :any, virtual: true
    field :permissions, :any, virtual: true

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [:author_id, :project_id, :description, :status, :acknowledged_by_id, :acknowledged_at, :subscription_list_id])
    |> validate_required([:author_id, :project_id, :description, :status, :subscription_list_id])
  end

  # After load hooks

  import Ecto.Query, only: [from: 2]

  def load_potential_subscribers(check_in = %__MODULE__{}) do
    q = from(c in Operately.Projects.Contributor, join: p in assoc(c, :person), preload: :person)
    tmp_check_in = Repo.preload(check_in, [:access_context, [project: [contributors: q]]], force: true)

    subs =
      tmp_check_in
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_project_child()

    %{check_in | potential_subscribers: subs}
  end

  def preload_permissions(check_in) do
    preload_permissions(check_in, check_in.requester_access_level)
  end

  def preload_permissions(check_in, access_level) do
    preload_permissions(check_in, access_level, check_in.request_info.requester.id)
  end

  def preload_permissions(check_in, access_level, user_id) do
    check_in = Repo.preload(check_in, [project: [:champion, :reviewer]])

    permissions = Operately.Projects.Permissions.calculate(access_level, check_in, user_id)
    Map.put(check_in, :permissions, permissions)
  end

  def preload_comment_count(check_ins) when is_list(check_ins) do
    ids = Enum.map(check_ins, & &1.id)

    comment_counts =
      Repo.all(
        from c in Operately.Updates.Comment,
          where: c.entity_type == :project_check_in and c.entity_id in ^ids,
          group_by: c.entity_id,
          select: {c.entity_id, count(c.id)}
      )

    comment_counts_map = Map.new(comment_counts)

    Enum.map(check_ins, fn check_in ->
      comment_count = Map.get(comment_counts_map, check_in.id, 0)
      Map.put(check_in, :comment_count, comment_count)
    end)
  end

  def valid_status, do: @valid_statuses
end
