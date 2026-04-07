defmodule Operately.Notifications.DigestItems do
  require Logger

  def build(notifications, person) do
    {digest_items, included_notifications} =
      Enum.reduce(notifications, {[], []}, fn notification, {items, included} ->
        activity = notification.activity

        case buffered_item(person, activity) do
          {:ok, item} ->
            {[item | items], [notification | included]}

          :skip ->
            {items, included}
        end
      end)

    {Enum.reverse(digest_items), Enum.reverse(included_notifications)}
  end

  def buffered_item(person, activity) do
    module = email_module(activity)

    if Code.ensure_loaded?(module) and function_exported?(module, :buffered_item, 2) do
      {:ok, apply(module, :buffered_item, [person, activity])}
    else
      Logger.warning("Activity #{activity.action} does not have buffered_item/2 implemented, skipping digest item")
      :skip
    end
  rescue
    ArgumentError ->
      Logger.warning("Activity #{activity.action} does not map to a known email module, skipping digest item")
      :skip
  end

  defp email_module(activity) do
    String.to_existing_atom("Elixir.OperatelyEmail.Emails.#{Macro.camelize(activity.action)}Email")
  end
end
