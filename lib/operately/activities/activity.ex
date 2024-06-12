defmodule Operately.Activities.Activity do
  use Operately.Schema

  @deprecated_actions [
    "project_status_update_acknowledged",
    "project_status_update_commented",
    "project_status_update_edit",
    "project_status_update_submitted",
    "project_review_submitted",
    "project_review_request_submitted",
    "project_review_acknowledged",
    "project_review_commented",
  ]

  schema "activities" do
    belongs_to :author, Operately.People.Person
    belongs_to :comment_thread, Operately.Comments.CommentThread

    belongs_to :context, Operately.Access.Context, foreign_key: :context_id

    field :action, :string
    field :content, :map

    field :resource_id, :binary_id
    field :resource_type, :string

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(activity, attrs) do
    activity |> cast(attrs, [:author_id, :action, :content, :comment_thread_id, :context_id])
  end

  def deprecated_actions, do: @deprecated_actions
end
