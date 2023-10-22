defmodule Operately.Activities.NotificationDispatcher do
  use Oban.Worker

  def perform(job) do
    activity_id = job.args["activity_id"]
    activity = Operately.Activities.get_activity!(activity_id)

    dispatch(activity)
  end

  def dispatch(activity) do 
    full_module_name = "Elixir.Operately.Activities.Notifications.#{Macro.camelize(activity.action)}"
    module = String.to_existing_atom(full_module_name)

    apply(module, :dispatch, [activity])
  end
end
