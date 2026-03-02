defmodule OperatelyWeb.Api.ExternalMutations.Mutations.MarkNotificationAsRead do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase
  import Ecto.Query, only: [from: 2]

  @impl true
  def mutation_name, do: "mark_notification_as_read"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> add_notification()
  end

  @impl true
  def inputs(ctx) do
    %{
      id: ctx.notification.id
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end

  defp add_notification(ctx) do
    activity =
      Operately.Repo.one!(
        from a in Operately.Activities.Activity,
          order_by: [desc: a.inserted_at],
          limit: 1
      )
  
    {:ok, notification} =
      Operately.Notifications.create_notification(%{
        person_id: ctx.creator.id,
        activity_id: activity.id,
        should_send_email: false,
        read: false
      })
  
    Map.put(ctx, :notification, notification)
  end
end
