defmodule Operately.Comments.CommentThread do
  use Operately.Schema

  schema "comment_threads" do
    has_many :reactions, Operately.Updates.Reaction, foreign_key: :entity_id, where: [entity_type: :comment_thread]
    has_many :comments, Operately.Updates.Comment, foreign_key: :entity_id, where: [entity_type: :comment_thread]

    field :parent_id, :binary_id
    field :parent_type, Ecto.Enum, values: [:activity]
    
    field :title, :string
    field :has_title, :boolean, default: false

    field :message, :map

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(comment_thread, attrs) do
    comment_thread 
    |> cast(attrs, [:message, :parent_id, :parent_type, :title, :has_title])
    |> validate_required([:message, :parent_id, :parent_type])
  end
end
