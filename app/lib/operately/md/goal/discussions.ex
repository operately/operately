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

    #{render_person_name_only(discussion.author)}
    #{render_date(discussion)}

    #{Operately.MD.RichText.render(discussion.message)}

    #{render_reactions(discussion.reactions)}

    #{render_comments(discussion.comments)}
    """
  end

  defp render_person(role, person) do
    if person do
      "#{role}: #{person.full_name} (#{person.title})"
    else
      "#{role}: Not Assigned"
    end
  end

  defp render_person_name_only(person) do
    if person do
      "#{person.full_name} (#{person.title})"
    else
      "Not Assigned"
    end
  end

  defp render_date(discussion) do
    "Published on: #{discussion.inserted_at |> Operately.Time.as_date() |> Date.to_iso8601()}"
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

    activity.comment_thread
  end
end
