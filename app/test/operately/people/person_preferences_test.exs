defmodule Operately.People.PersonPreferencesTest do
  use Operately.DataCase, async: true

  alias Operately.People.Preferences
  alias Operately.People.Preferences.Notifications, as: NotificationPreferences
  alias Operately.People.Person

  describe "changeset/2" do
    test "creates default notification preferences for new people" do
      changeset = Person.changeset(%Person{}, %{})

      person = Ecto.Changeset.apply_changes(changeset)

      assert person.preferences.notifications.notify_about_assignments
      assert person.preferences.notifications.notify_on_mention
      assert person.preferences.notifications.send_daily_summary
    end

    test "merges provided notification preferences into defaults for new people" do
      changeset =
        Person.changeset(%Person{}, %{
          preferences: %{
            notifications: %{
              notify_about_assignments: false
            }
          }
        })

      person = Ecto.Changeset.apply_changes(changeset)

      refute person.preferences.notifications.notify_about_assignments
      assert person.preferences.notifications.notify_on_mention
      assert person.preferences.notifications.send_daily_summary
    end

    test "merges provided notification preferences into existing preferences on update" do
      person = %Person{
        id: Ecto.UUID.generate(),
        preferences: %Preferences{
          notifications: %NotificationPreferences{
            notify_about_assignments: true,
            notify_on_mention: false,
            send_daily_summary: false
          }
        }
      }

      changeset =
        Person.changeset(person, %{
          preferences: %{
            notifications: %{
              notify_about_assignments: false
            }
          }
        })

      updated_person = Ecto.Changeset.apply_changes(changeset)

      refute updated_person.preferences.notifications.notify_about_assignments
      refute updated_person.preferences.notifications.notify_on_mention
      refute updated_person.preferences.notifications.send_daily_summary
    end
  end

  describe "notification preferences helpers" do
    test "fall back to embedded defaults when preferences are missing" do
      assert Person.notify_about_assignments?(%Person{})
      assert Person.notify_on_mention?(%Person{})
      assert Person.send_daily_summary?(%Person{})
    end

    test "use embedded notification settings when present" do
      person = %Person{
        preferences: %Preferences{
          notifications: %NotificationPreferences{
            notify_about_assignments: false,
            notify_on_mention: false,
            send_daily_summary: false
          }
        }
      }

      refute Person.notify_about_assignments?(person)
      refute Person.notify_on_mention?(person)
      refute Person.send_daily_summary?(person)
    end
  end
end
