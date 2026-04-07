defmodule Operately.Data.Change097BackfillNotifyOnMentionFromEmailPreferenceTest do
  use Operately.DataCase, async: true

  alias Operately.Data.Change097BackfillNotifyOnMentionFromEmailPreference, as: Change

  test "maps mentions_only to notify_on_mention true and normalizes email_preference to buffered" do
    preferences =
      Change.normalize_preferences(%{
        "notifications" => %{
          "email_preference" => "mentions_only",
          "email_window_minutes" => 15
        }
      })

    assert preferences == %{
             "notifications" => %{
               "email_preference" => "buffered",
               "email_window_minutes" => 15,
               "notify_on_mention" => true
             }
           }
  end

  test "maps buffered to notify_on_mention false" do
    preferences =
      Change.normalize_preferences(%{
        notifications: %{
          email_preference: :buffered,
          email_window_minutes: 30
        }
      })

    assert preferences == %{
             "notifications" => %{
               "email_preference" => "buffered",
               "email_window_minutes" => 30,
               "notify_on_mention" => false
             }
           }
  end
end
