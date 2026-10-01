defmodule OperatelyEmail.Emails.GoalCheckInEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Goals.Update
  alias Operately.ContextualDates.Timeframe

  alias OperatelyWeb.Paths
  alias OperatelyEmail.CheckInOverview

  def send(person, activity) do
    update_id = activity.content["update_id"]

    case load_update(update_id, person) do
      {:ok, update} -> send_email(person, update)
      {:error, :not_found} -> :skip
    end
  end

  defp send_email(person, update) do
    company = update.goal.company
    author = update.author
    goal = update.goal

    {cta_text, cta_url} = construct_cta_text_and_url(company, update, person)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{goal_name}) %{author} submitted a check-in", goal_name: goal.name, author: Operately.People.Person.short_name(author)))
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> assign(:cta_url, cta_url)
    |> assign(:cta_text, cta_text)
    |> assign(:overview, CheckInOverview.construct(:goal, update.status, goal.reviewer, Timeframe.end_date(update.timeframe)))
    |> assign(:targets, update.goal.targets)
    |> assign(:checks, sort_by_index(update.checks))
    |> render("goal_check_in")
  end

  defp construct_cta_text_and_url(company, update, person) do
    url = Paths.goal_check_in_path(company, update) |> Paths.to_url()

    OperatelyEmail.AcknowledgeCta.build(
      person,
      update.author_id,
      [update.goal.reviewer_id, update.goal.champion_id],
      url,
      gettext("View Check-In")
    )
  end

  defp load_update(update_id, person) do
    Update.get(person,
      id: update_id,
      opts: [
        preload: [goal: [:company, :reviewer, :targets, :checks], author: []]
      ]
    )
  end

  defp sort_by_index(checks) do
    Enum.sort_by(checks, & &1.index)
  end

  def buffered_item(person, activity) do
    case Update.get(person, id: activity.content["update_id"], opts: [preload: :goal]) do
      {:ok, update} -> build_buffered_item(update, activity)
      {:error, :not_found} -> :skip
    end
  end

  defp build_buffered_item(update, activity) do
    goal = update.goal
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(update.message)

    %{
      parent_id: goal.id,
      parent_type: :goal,
      parent_name: goal.name,
      headline: "submitted a check-in with status \"#{status_label(update.status)}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.goal_check_in_path(company, update) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp status_label(:on_track), do: "on track"
  defp status_label(:off_track), do: "off track"
  defp status_label(status) when is_binary(status), do: status
  defp status_label(status) when is_atom(status), do: Atom.to_string(status)
end
