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

    #{render_person("Author", discussion.author)}
    #{render_date(discussion)}

    #{Operately.MD.RichText.render(discussion.message)}

    #{render_reactions(discussion.reactions)}
    """
  end

  defp render_person(role, person) do
    if person do
      "#{role}: #{person.full_name} (#{person.title})"
    else
      "#{role}: Not Assigned"
    end
  end

  defp render_date(discussion) do
    "Published on: #{discussion.inserted_at |> Operately.Time.as_date() |> Date.to_iso8601()}"
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
          preload: [comment_thread: [:author, reactions: :person]]
        ]
      )

    activity.comment_thread
  end
end
