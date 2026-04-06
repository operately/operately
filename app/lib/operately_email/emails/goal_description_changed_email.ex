defmodule OperatelyEmail.Emails.GoalDescriptionChangedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Goals, Repo}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    goal = Goals.get_goal!(activity.content["goal_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "updated the goal description")
    |> assign(:author, author)
    |> assign(:goal_name, goal.name)
    |> assign(:description, decode_description(activity.content["new_description"]))
    |> assign(:cta_url, Paths.goal_path(company, goal) |> Paths.to_url())
    |> render("goal_description_changed")
  end

  defp decode_description(nil), do: nil

  defp decode_description(description) when is_binary(description) do
    case Jason.decode(description) do
      {:ok, decoded} -> decoded
      _ -> nil
    end
  end

  defp decode_description(description) when is_map(description), do: description
  defp decode_description(_), do: nil

  def buffered_item(_person, activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    excerpt_html =
      if is_map(decode_description(activity.content["new_description"])) do
        decode_description(activity.content["new_description"])
        |> OperatelyEmail.Templates.rich_text()
        |> Phoenix.HTML.safe_to_string()
      else
        nil
      end

    excerpt_text =
      if is_map(decode_description(activity.content["new_description"])) do
        decode_description(activity.content["new_description"])
        |> Operately.RichContent.rich_content_to_string()
        |> String.trim()
      else
        nil
      end

    excerpt_html = if excerpt_html in [nil, ""], do: nil, else: excerpt_html
    excerpt_text = if excerpt_text in [nil, ""], do: nil, else: excerpt_text

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: "updated this goal description",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.goal_path(company, goal) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
