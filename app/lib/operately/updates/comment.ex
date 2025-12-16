defmodule Operately.Updates.Comment do
  use Operately.Schema
  import Ecto.Changeset

  schema "comments" do
    belongs_to :update, Operately.Updates.Update
    belongs_to :author, Operately.People.Person

    field :entity_id, Ecto.UUID
    field :entity_type, Ecto.Enum, values: [
      :project_check_in,
      :project_milestone,
      :goal_update,
      :message,
      :update,
      :comment_thread,
      :project_retrospective,
      :resource_hub_document,
      :resource_hub_file,
      :resource_hub_link,
      :project_task,
      :space_task,
    ]

    field :content, :map

    has_many :reactions, Operately.Updates.Reaction, foreign_key: :entity_id, where: [entity_type: :comment]

    # populated with after load hooks
    field :notification, :any, virtual: true

    timestamps()
    requester_access_level()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(comment, attrs) do
    comment
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:content, :author_id])
  end

  import Ecto.Query, only: [from: 2]

  @doc """
  Loads the comment counts for a list of resources that have comments.
  """
  def load_comments_count(parents) when is_list(parents) do
    parent_ids = Enum.map(parents, &(&1.id))

    counts =
      from(c in Operately.Updates.Comment,
        where: c.entity_id in ^parent_ids,
        group_by: c.entity_id,
        select: {c.entity_id, count(c.id)}
      )
      |> Repo.all()
      |> Enum.into(%{})

    Enum.map(parents, fn m ->
      count = Map.get(counts, m.id, 0)
      Map.put(m, :comments_count, count)
    end)
  end
end
