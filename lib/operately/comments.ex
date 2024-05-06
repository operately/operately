defmodule Operately.Comments do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Comments.CommentThread
  alias Operately.Comments.MilestoneComment
  alias Operately.Comments.CreateMilestoneCommentOperation

  def get_thread!(id), do: Repo.get!(CommentThread, id)

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
