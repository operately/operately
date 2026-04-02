defmodule Operately.Data.Change096MovePersonNotificationSettingsToPreferencesTest do
  use Operately.DataCase, async: true

  alias Operately.Data.Change096MovePersonNotificationSettingsToPreferences, as: Change

  test "merges legacy notification fields into preferences.notifications" do
    preferences =
      Change.merge_preferences(%{
        preferences: %{},
        notify_about_assignments: false,
        notify_on_mention: true,
        send_daily_summary: false
      })

    assert preferences == %{
             "notifications" => %{
               "notify_about_assignments" => false,
               "notify_on_mention" => true,
               "send_daily_summary" => false
             }
           }
  end

  test "preserves existing embedded values" do
    preferences =
      Change.merge_preferences(%{
        preferences: %{
          "notifications" => %{
            "notify_about_assignments" => true
          }
        },
        notify_about_assignments: false,
        notify_on_mention: false,
        send_daily_summary: false
      })

    assert preferences == %{
             "notifications" => %{
               "notify_about_assignments" => true,
               "notify_on_mention" => false,
               "send_daily_summary" => false
             }
           }
  end
end
