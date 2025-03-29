defmodule Operately.Comments do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Comments.CommentThread
  alias Operately.Comments.MilestoneComment
  alias Operately.Comments.CreateMilestoneCommentOperation

  alias Operately.Activities.Activity
  alias Operately.Access.{Binding, Fetch}

  def get_thread!(id), do: Repo.get!(CommentThread, id)

  def get_thread_with_activity_and_access_level(id, person_id) do
    query = from(t in CommentThread, as: :thread,
        join: a in Activity, on: a.id == t.parent_id, as: :resource,
        where: t.id == ^id
      )
      |> Fetch.join_access_level(person_id)


    from([thread: t, resource: a, binding: b] in query,
      where: b.access_level >= ^Binding.view_access(),
      group_by: [t.id, a.id],
      select: {a, t, max(b.access_level)}
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      {activity, thread, level} ->
        activity = apply(activity.__struct__, :set_requester_access_level, [activity, level])
        {:ok, Map.put(thread, :activity, activity)}
    end
  end

  def list_milestone_comments do
    Repo.all(MilestoneComment)
  end

  def list_milestone_comments(milestone_id) do
    Repo.all(from mc in MilestoneComment, where: mc.milestone_id == ^milestone_id, preload: [:comment])
  end

  def get_milestone_comment!(id), do: Repo.get!(MilestoneComment, id)

  def create_milestone_comment(author, milestone, action, comment_attrs = %{}) do
    CreateMilestoneCommentOperation.run(author, milestone, action, comment_attrs)
  end

  def update_milestone_comment(%MilestoneComment{} = milestone_comment, attrs) do
    milestone_comment
    |> MilestoneComment.changeset(attrs)
    |> Repo.update()
  end

  def delete_milestone_comment(%MilestoneComment{} = milestone_comment) do
    Repo.delete(milestone_comment)
  end

  def change_milestone_comment(%MilestoneComment{} = milestone_comment, attrs \\ %{}) do
    MilestoneComment.changeset(milestone_comment, attrs)
  end
end
