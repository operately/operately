defmodule Operately.Activities.NotificationDispatcher do
  use Oban.Worker

  require Logger

  def perform(job) do
    activity_id = job.args["activity_id"]
    activity = Operately.Activities.get_activity!(activity_id)

    full_module_name = "Elixir.Operately.Activities.Notifications.#{Macro.camelize(activity.action)}"
    module = String.to_existing_atom(full_module_name)

    apply(module, :dispatch, [activity])
  rescue
    e ->
      Logger.error("Failed to dispatch notification: #{inspect(e)}")
      Logger.error(Exception.format(:error, e, __STACKTRACE__))
      {:error, e}
  end
end
