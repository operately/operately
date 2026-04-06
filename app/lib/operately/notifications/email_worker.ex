defmodule Operately.Notifications.EmailWorker do
  require Logger
  use Oban.Worker

  alias Operately.Notifications.EmailDelivery

  def perform(job) do
    notification_id = job.args["notification_id"]
    notification = Operately.Notifications.get_notification!(notification_id)

    case deliver(notification) do
      {:ok, _result} -> :ok
      {:error, reason} -> {:error, reason}
    end
  rescue
    e ->
      Logger.error("Failed to send email")
      Logger.error(Exception.format(:error, e, __STACKTRACE__))
      {:error, e}
  end

  def deliver(notification) do
    person = Operately.People.get_person!(notification.person_id)
    activity = Operately.Activities.get_activity!(notification.activity_id)

    if person.account_id != nil do
      module = email_module(activity)

      with {:ok, _result} <- deliver_email(module, person, activity),
           {:ok, _notification} <- EmailDelivery.mark_sent(notification) do
        {:ok, :sent}
      end
    else
      {:ok, :skipped}
    end
  end

  defp email_module(activity) do
    String.to_existing_atom("Elixir.OperatelyEmail.Emails.#{Macro.camelize(activity.action)}Email")
  end

  defp deliver_email(module, person, activity) do
    case apply(module, :send, [person, activity]) do
      {:error, reason} -> {:error, reason}
      result -> {:ok, result}
    end
  end
end
