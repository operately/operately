defmodule Operately.Notifications.EmailWorker do
  require Logger
  use Oban.Worker

  def perform(job) do
    notification_id = job.args["notification_id"]
    notification = Operately.Notifications.get_notification!(notification_id)
    person = Operately.People.get_person!(notification.person_id)
    activity = Operately.Activities.get_activity!(notification.activity_id)

    if person.account_id != nil do
      module = email_module(activity)
      apply(module, :send, [person, activity])
    else
      :ok
    end
  rescue
    e ->
      Logger.error("Failed to send email")
      Logger.error(Exception.format(:error, e, __STACKTRACE__))
      {:error, e}
  end

  defp email_module(activity) do
    String.to_existing_atom("Elixir.OperatelyEmail.Emails.#{Macro.camelize(activity.action)}Email")
  end
end
