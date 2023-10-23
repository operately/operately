defmodule Operately.Notifications.EmailWorker do
  require Logger
  use Oban.Worker

  def perform(job) do
    notification_id = job.args["notification_id"]
    notification = Operately.Notifications.get_notification!(notification_id)
    person = Operately.People.get_person!(notification.person_id)
    activity = Operately.Activities.get_activity!(notification.activity_id)

    module = String.to_existing_atom("Elixir.OperatelyEmail.#{Macro.camelize(activity.action)}Email")

    apply(module, :send, [person, activity])
  rescue
    e ->
      Logger.error("Failed to send email")
      Logger.error(Exception.format(:error, e, __STACKTRACE__))
      {:error, e}
  end
end
