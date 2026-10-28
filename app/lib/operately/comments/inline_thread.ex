defmodule Operately.Comments.InlineThread do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Repo.Getter.Profile

  schema "inline_threads" do
    belongs_to :document, Operately.ResourceHubs.Document, foreign_key: :resource_id
    belongs_to :author, Operately.People.Person
    belongs_to :resolved_by, Operately.People.Person

    field :resource_type, Ecto.Enum, values: [:resource_hub_document]
    field :resolved_at, :utc_datetime

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

  def preloads do
    messages = from(c in Operately.Updates.Comment, order_by: [asc: c.inserted_at], preload: [:author, reactions: :person])
    [:document, :author, :resolved_by, messages: messages]
  end

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
