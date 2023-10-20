defmodule Operately.Activities.NotificationDispatcher do
  use Oban.Worker

  def perform(job) do
    activity_id = job.args[:activity_id]
    activity = Operately.Activities.get_activity!(activity_id)
  end
end
