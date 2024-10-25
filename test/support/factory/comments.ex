defmodule Operately.Support.Factory.Comments do
  alias Operately.Support.RichText

  def add_comment(ctx, testid, parent_name, opts \\ []) do
    creator = Keyword.get(opts, :creator, ctx.creator)
    entity_type = find_entity_type(ctx[parent_name])

    {:ok, comment} = Operately.Operations.CommentAdding.run(creator, ctx[parent_name], entity_type, RichText.rich_text("Content"))

    Map.put(ctx, testid, comment)
  end

  #
  # Helpers
  #

  defp find_entity_type(%Operately.Messages.Message{}), do: "message"
  defp find_entity_type(%Operately.Projects.CheckIn{}), do: "project_check_in"
  defp find_entity_type(%Operately.Goals.Update{}), do: "goal_update"
  defp find_entity_type(%Operately.Comments.CommentThread{}), do: "comment_thread"
  defp find_entity_type(%Operately.Projects.Retrospective{}), do: "project_retrospective"
end
