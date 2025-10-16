defmodule Operately.Data.Change049PopulateCommentEntityIdWithMilestoneId do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  def run do
    Repo.transaction(fn ->
      update_comments()
    end)
  end

  defp update_comments do
    from(c in Operately.Updates.Comment,
      join: mc in Operately.Comments.MilestoneComment,
      on: mc.comment_id == c.id,
      where: is_nil(c.entity_id) or is_nil(c.entity_type),
      update: [
        set: [
          entity_id: mc.milestone_id,
          entity_type: :project_milestone
        ]
      ]
    )
    |> Repo.update_all([])
  end
end
