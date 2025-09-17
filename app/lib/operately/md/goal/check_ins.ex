defmodule Operately.MD.Goal.CheckIns do
  def render(check_ins) do
    check_ins_with_comments = load_check_ins_with_comments(check_ins)

    if Enum.empty?(check_ins_with_comments) do
      """
      ## Check-ins

      _No check-ins yet._
      """
    else
      """
      ## Check-ins

      #{Enum.map_join(check_ins_with_comments, "\n\n", &render_check_in/1)}
      """
    end
  end

  defp render_check_in(check_in) do
    """
    ### Check-in on #{render_date(check_in.inserted_at)}

    #{render_person("Author", check_in.author)}

    #{Operately.MD.RichText.render(check_in.message)}

    #{render_check_in_comments(check_in.comments || [])}
    """
  end

  defp render_check_in_comments([]) do
    ""
  end

  defp render_check_in_comments(comments) do
    """
    #### Comments

    #{Enum.map_join(comments, "\n\n", &render_check_in_comment/1)}
    """
  end

  defp render_check_in_comment(comment) do
    """
    **#{comment.author.full_name}** on #{render_date(comment.inserted_at)}:

    #{Operately.MD.RichText.render(comment.content["message"])}
    """
  end

  defp load_check_ins_with_comments(check_ins) do
    Enum.map(check_ins, fn check_in ->
      comments = load_comments_for_check_in(check_in.id)
      Map.put(check_in, :comments, comments)
    end)
  end

  defp load_comments_for_check_in(check_in_id) do
    import Ecto.Query

    from(c in Operately.Updates.Comment,
      where: c.entity_id == ^check_in_id and c.entity_type == :goal_update,
      order_by: [asc: c.inserted_at],
      preload: [:author]
    )
    |> Operately.Repo.all()
  end

  defp render_date(date) do
    Operately.Time.as_date(date) |> Date.to_iso8601()
  end

  defp render_person(role, person) do
    if person do
      "#{role}: #{person.full_name} (#{person.title})"
    else
      "#{role}: Not Assigned"
    end
  end
end
