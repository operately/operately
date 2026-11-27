defmodule Operately.Comments.InlineThread do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Repo.Getter.Profile
  alias Operately.Updates.Comment

  @recent_reply_count 2
  @thread_preloads [:document, :author, :resolved_by]
  @message_preloads [:author, reactions: :person]

  schema "inline_threads" do
    belongs_to :document, Operately.ResourceHubs.Document, foreign_key: :resource_id
    belongs_to :author, Operately.People.Person
    belongs_to :resolved_by, Operately.People.Person

    field :resource_type, Ecto.Enum, values: [:resource_hub_document]
    field :resolved_at, :utc_datetime
    field :earlier_reply_count, :integer, virtual: true, default: 0

    embeds_one :anchor, Operately.Comments.InlineAnchor, on_replace: :update

    has_many :messages, Operately.Updates.Comment, foreign_key: :entity_id, where: [entity_type: :inline_thread]
    has_one :space_access_context, through: [:document, :space_access_context]
    has_one :project_access_context, through: [:document, :project_access_context]
    has_one :goal_access_context, through: [:document, :goal_access_context]

    timestamps()
    request_info()
  end

  def resource_types, do: Ecto.Enum.values(__MODULE__, :resource_type)

  def getter_profile(:default) do
    %Profile{scope: &published_documents/1, access_contexts: [:space_access_context, :project_access_context, :goal_access_context]}
  end

  defp published_documents(query) do
    from(t in query, join: d in assoc(t, :document), where: d.state == :published and is_nil(d.deleted_at))
  end

  def read_options do
    [preload: preloads(), after_load: [&set_anchor_version/1]]
  end

  def preview_options do
    [preload: @thread_preloads, after_load: [&set_anchor_version/1]]
  end

  def preloads do
    messages = from(c in Comment, order_by: [asc: c.inserted_at, asc: c.id], preload: ^@message_preloads)
    @thread_preloads ++ [messages: messages]
  end

  # Only return preview rows from the database. Count and rank against the same snapshot.
  def load_previews([]), do: []

  def load_previews(threads) do
    thread_ids = Enum.map(threads, & &1.id)

    ranked_messages =
      from(c in Comment,
        where: c.entity_type == :inline_thread and c.entity_id in ^thread_ids,
        windows: [
          thread: [partition_by: c.entity_id],
          chronological: [partition_by: c.entity_id, order_by: [asc: c.inserted_at, asc: c.id]]
        ],
        select: %{id: c.id, position: over(row_number(), :chronological), size: over(count(), :thread)}
      )

    previews =
      from(c in Comment,
        join: ranked in subquery(ranked_messages),
        on: c.id == ranked.id,
        where: ranked.position == 1 or ranked.position > ranked.size - @recent_reply_count,
        order_by: [asc: ranked.position],
        preload: ^@message_preloads,
        select: {c, ranked.size}
      )
      |> Repo.all()
      |> Enum.group_by(fn {message, _size} -> message.entity_id end)

    Enum.map(threads, fn thread ->
      case Map.get(previews, thread.id) do
        [{_, size} | _] = rows ->
          %{thread | messages: Enum.map(rows, &elem(&1, 0)), earlier_reply_count: earlier_reply_count(size)}

        nil ->
          %{thread | messages: []}
      end
    end)
  end

  def preview_loaded_thread(nil), do: nil

  def preview_loaded_thread(thread) do
    count = earlier_reply_count(length(thread.messages))

    case thread.messages do
      [opening | _] when count > 0 ->
        %{thread | messages: [opening | Enum.take(thread.messages, -@recent_reply_count)], earlier_reply_count: count}

      _ ->
        thread
    end
  end

  defp earlier_reply_count(size), do: max(size - 1 - @recent_reply_count, 0)

  def set_anchor_version(thread) do
    %{thread | anchor: Operately.Comments.InlineAnchor.for_version(thread.anchor, thread.document.current_version)}
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:resource_type, :resource_id, :author_id])
    |> put_embed(:anchor, attrs.anchor)
    |> validate_required([:resource_type, :resource_id, :author_id, :anchor])
    |> foreign_key_constraint(:resource_id)
  end
end
