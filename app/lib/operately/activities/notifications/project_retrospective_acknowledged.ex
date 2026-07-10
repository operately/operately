defmodule Operately.Activities.Notifications.ProjectRetrospectiveAcknowledged do
  alias Operately.{Projects, Repo}

  def dispatch(activity) do
    retrospective =
      activity.content["retrospective_id"]
      |> Projects.get_retrospective!()
      |> Repo.preload(:author)

    case retrospective.author do
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
