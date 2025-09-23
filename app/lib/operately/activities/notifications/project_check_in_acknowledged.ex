defmodule Operately.Activities.Notifications.ProjectCheckInAcknowledged do
  alias Operately.{Projects, Repo}

  def dispatch(activity) do
    check_in =
      activity.content["check_in_id"]
      |> Projects.get_check_in!()
      |> Repo.preload(:author)

    case check_in.author do
      nil -> :ok
      author ->
        Operately.Notifications.bulk_create([
          %{
            person_id: author.id,
            activity_id: activity.id,
            should_send_email: true,
          }
        ])
    end
  end
end
