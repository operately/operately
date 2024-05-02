defmodule Operately.Comments.CommentThread do
  use Operately.Schema

  schema "comment_threads" do
    field :message, :map # Tiptap JSON

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(comment_thread, attrs) do
    comment_thread |> cast(attrs, [:message])
  end
end
