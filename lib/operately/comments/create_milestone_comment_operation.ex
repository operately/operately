defmodule Operately.Comments.CreateMilestoneCommentOperation do
  alias Operately.Repo
  alias Ecto.Multi

  alias Operately.Updates.Comment
  alias Operately.Activities
  alias Operately.Comments.MilestoneComment

  def run(author, milestone, action, comment_attrs) do
    Multi.new()
    |> Multi.insert(:comment, Comment.changeset(comment_attrs))
    |> insert_milestone_comment(milestone, action)
    |> apply_comment_action(milestone, action)
    |> record_activity(author, milestone, action)
    |> Repo.transaction()
    |> Repo.extract_result(:comment)
  end
  
  defp insert_milestone_comment(multi, milestone, action) do
    Multi.insert(multi, :milestone_comment, fn changes ->
      MilestoneComment.changeset(%{
        milestone_id: milestone.id,
        comment_id: changes[:comment].id,
        action: action
      })
    end)
  end

  defp apply_comment_action(multi, milestone, action) do
    case action do
      "complete" ->
        changeset = Operately.Projects.Milestone.changeset(milestone, %{
          status: :done,
          completed_at: DateTime.utc_now()
        })

        Multi.update(multi, :milestone, changeset)
      "reopen" ->
        changeset = Operately.Projects.Milestone.changeset(milestone, %{
          status: :pending,
          completed_at: nil
        })

        Multi.update(multi, :milestone, changeset)
      _ ->
        multi
    end
  end

  defp record_activity(multi, author, milestone, action) do
    Activities.insert(multi, author.id, :project_milestone_commented, fn changes ->
      project = Repo.get!(Operately.Projects.Project, milestone.project_id)

      %{
        company_id: project.company_id,
        project_id: project.id,
        milestone_id: milestone.id,
        comment_id: changes[:comment].id,
        comment_action: action
      }
    end)
  end
end
