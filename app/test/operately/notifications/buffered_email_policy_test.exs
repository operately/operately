defmodule Operately.Notifications.BufferedEmailPolicyTest do
  use Operately.DataCase

  alias Operately.Notifications.BufferedEmailPolicy
  alias Operately.People.Person
  alias Operately.People.Preferences
  alias Operately.People.Preferences.Notifications, as: NotificationPreferences

  describe "buffer window" do
    test "uses the policy default of five minutes" do
      assert BufferedEmailPolicy.buffer_window_minutes() == 5
    end

    test "reads the configured preference and window from person preferences" do
      person = %Person{
        preferences: %Preferences{
          notifications: %NotificationPreferences{
            email_preference: :buffered,
            notify_on_mention: false,
            email_window_minutes: 30
          }
        }
      }

      assert BufferedEmailPolicy.email_preference(person) == :buffered
      assert BufferedEmailPolicy.buffered?(person)
      refute BufferedEmailPolicy.notify_on_mention?(person)
      assert BufferedEmailPolicy.buffer_window_minutes(person) == 30
    end
  end

  describe "action policy" do
    test "identifies bypassed actions" do
      assert BufferedEmailPolicy.bypass_action?(:guest_invited)
      assert BufferedEmailPolicy.bypass_action?("project_permissions_edited")
      refute BufferedEmailPolicy.bypass_action?("project_due_date_updating")
      assert BufferedEmailPolicy.bufferable_action?("project_due_date_updating")
    end
  end
end
