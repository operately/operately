defmodule Operately.Comments do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Comments.MilestoneComment
  alias Operately.Updates.Comment

  def list_milestone_comments do
    Repo.all(MilestoneComment)
  end

  def list_milestone_comments(milestone_id) do
    Repo.all(from mc in MilestoneComment, where: mc.milestone_id == ^milestone_id, preload: [:comment])
  end

  def get_milestone_comment!(id), do: Repo.get!(MilestoneComment, id)

  def create_milestone_comment(person, milestone, action, comment_attrs = %{}) do
    Repo.transaction(fn ->
      {:ok, comment} = %Comment{} |> Comment.changeset(comment_attrs) |> Repo.insert()

      {:ok, milestone_comment} = %MilestoneComment{} |> MilestoneComment.changeset(%{
        milestone_id: milestone.id,
        comment_id: comment.id,
        action: action
      }) |> Repo.insert()

      if action == "complete" do
        {:ok, _} = Operately.Projects.complete_milestone(person, milestone)
      end

      if action == "reopen" do
        {:ok, _} = Operately.Projects.uncomplete_milestone(person, milestone)
      end

      milestone_comment
    end)
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
