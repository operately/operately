defmodule Operately.MD.Goal.Discussions do
  def render(discussions) do
    if Enum.empty?(discussions) do
      """
      ## Discussions

      _No discussions yet._
      """
    else
      """
      ## Discussions

      #{Enum.map_join(discussions, "\n\n", &render_discussion/1)}
      """
    end
  end

  defp render_discussion(discussion) do
    discussion = load_additional_data(discussion)

    """
    ### #{discussion.title}

    Author: #{discussion.author.full_name}
    Posted on: #{render_date(discussion.inserted_at)}

    #{Operately.MD.RichText.render(discussion.message)}

    #{render_reactions(discussion.reactions)}

    #{render_comments(discussion.comments)}
    """
  end

  defp render_date(date) do
    Operately.Time.as_date(date) |> Date.to_iso8601()
  end

  defp render_comments(comments) do
    if Enum.empty?(comments) do
      "_No comments yet._"
    else
      """
      ## Comments

      #{Enum.map_join(comments, "\n\n", &render_comment/1)}
      """
    end
  end

  defp render_comment(comment) do
    """
    ### Comment by #{comment.author.full_name} on #{Operately.Time.as_date(comment.inserted_at) |> Date.to_iso8601()}

    #{Operately.MD.RichText.render(comment.content["message"])}

    #{render_reactions(comment.reactions)}
    """
  end

  defp render_reactions(reactions) do
    case reactions do
      [] -> ""
      reactions -> "Reactions: #{Enum.map(reactions, &render_reaction/1) |> Enum.join(" ")}"
    end
  end

  defp render_reaction(reaction) do
    "#{reaction.person.full_name}: #{reaction.emoji}"
  end

  defp load_additional_data(discussion) do
    {:ok, activity} =
      Operately.Activities.Activity.get(:system,
        id: discussion.id,
        opts: [
          preload: [comment_thread: [:author, reactions: :person, comments: [:author, reactions: :person]]]
        ]
      )

    # Merge the loaded data with the existing discussion struct
    %{discussion | author: activity.comment_thread.author || discussion.author}
    |> Map.put(:reactions, activity.comment_thread.reactions || [])
    |> Map.put(:comments, activity.comment_thread.comments || [])
    |> Map.put(:message, activity.comment_thread.message || discussion.content)
  end
end
