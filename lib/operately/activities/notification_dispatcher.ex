defmodule Operately.Activities.NotificationDispatcher do
  use Oban.Worker
  require Logger
  alias Operately.Activities.Activity

  def perform(job) do
    activity = Operately.Repo.get!(Activity, job.params["activity_id"])
    handler = find_module("Operately.Activities.Notifications", activity.action)

    apply(handler, :dispatch, [activity])
  rescue
    err -> Logger.error(Exception.format(:error, err, __STACKTRACE__))
  end

  defp find_module(base, action) do
    full_module_name = "Elixir.#{base}.#{Macro.camelize(action)}"
    String.to_existing_atom(full_module_name)
  end
end
