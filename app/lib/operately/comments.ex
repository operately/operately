defmodule Operately.Comments do
  import Ecto.Query, warn: false
  alias Operately.Repo
  alias Operately.Access.Fetch
  alias Operately.Repo.RequestInfo

  alias Operately.Comments.CommentThread
  alias Operately.Comments.MilestoneComment
  alias Operately.Comments.CreateMilestoneCommentOperation

  def get_thread!(id), do: Repo.get!(CommentThread, id)

  def get_activity_thread(person, id) do
    from(t in CommentThread,
      join: a in assoc(t, :activity), as: :resource,
      where: t.id == ^id and t.parent_type == :activity and t.parent_id == a.id
    )
    |> Fetch.join_access_level(person.id)
    |> group_by([t, a], [t.id, a.id])
    |> select([t, a, binding: b], {t, a, max(b.access_level)})
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      {thread, activity, level} -> {:ok, RequestInfo.populate_request_info(%{thread | activity: activity}, person, level)}
    end
  end

  def list_comment_threads do
    Repo.all(CommentThread)
  end

  def update_comment_thread(thread = %CommentThread{}, attrs) do
    thread
    |> CommentThread.changeset(attrs)
    |> Repo.update()
  end

  def list_milestone_comments do
    Repo.all(MilestoneComment)
  end

  def list_milestone_comments(milestone_id) do
    Repo.all(from mc in MilestoneComment, where: mc.milestone_id == ^milestone_id, preload: [:comment])
  end

  def get_milestone_comment!(id), do: Repo.get!(MilestoneComment, id)

  def create_milestone_comment(author, milestone, action, comment_attrs = %{}) do
    CreateMilestoneCommentOperation.run(author, milestone, action, nil, comment_attrs)
  end

  def create_milestone_comment(author, milestone, action, open_tasks_resolution, comment_attrs) do
    CreateMilestoneCommentOperation.run(author, milestone, action, open_tasks_resolution, comment_attrs)
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
