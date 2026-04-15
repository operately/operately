defmodule Operately.Data.Change099SetSendDailySummaryToFalseTest do
  use Operately.DataCase
  import Ecto.Query

  alias Operately.Repo
  alias Operately.Data.Change099SetSendDailySummaryToFalse, as: Change
  alias Operately.Data.Change099SetSendDailySummaryToFalse.Person
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "run/0 sets send_daily_summary to false without changing other notification settings", ctx do
    ctx = Factory.add_company_member(ctx, :member_one)
    ctx = Factory.add_company_member(ctx, :member_two)

    set_preferences(ctx.creator.id, %{
      "appearance" => %{"theme" => "dark"},
      "notifications" => %{
        "email_preference" => "buffered",
        "email_window_minutes" => 15,
        "notify_about_assignments" => true,
        "notify_on_mention" => true,
        "send_daily_summary" => true
      }
    })

    set_preferences(ctx.member_one.id, %{
      notifications: %{
        notify_on_mention: true,
        send_daily_summary: true
      }
    })

    set_preferences(ctx.member_two.id, %{
      "appearance" => %{"theme" => "light"}
    })

    Change.run()

    creator_notifications = fetch_notifications(ctx.creator.id)
    assert map_get(creator_notifications, "send_daily_summary") == false
    assert map_get(creator_notifications, "notify_on_mention") == true
    assert map_get(creator_notifications, "notify_about_assignments") == true
    assert map_get(creator_notifications, "email_window_minutes") == 15
    assert map_get(fetch_preferences(ctx.creator.id), "appearance") == %{"theme" => "dark"}

    member_one_notifications = fetch_notifications(ctx.member_one.id)
    assert map_get(member_one_notifications, "send_daily_summary") == false
    assert map_get(member_one_notifications, "notify_on_mention") == true

    member_two_notifications = fetch_notifications(ctx.member_two.id)
    assert map_get(member_two_notifications, "send_daily_summary") == false
    assert map_get(fetch_preferences(ctx.member_two.id), "appearance") == %{"theme" => "light"}
  end

  test "set_send_daily_summary_to_false/1 forces send_daily_summary to false and preserves other notification fields" do
    preferences =
      Change.set_send_daily_summary_to_false(%{
        notifications: %{
          notify_on_mention: true,
          send_daily_summary: true,
          notify_about_assignments: true
        }
      })

    notifications = map_get(preferences, "notifications")
    assert map_get(notifications, "send_daily_summary") == false
    assert map_get(notifications, "notify_on_mention") == true
    assert map_get(notifications, "notify_about_assignments") == true
  end

  defp set_preferences(person_id, preferences) do
    from(p in Person, where: p.id == ^person_id)
    |> Repo.update_all(set: [preferences: preferences])
  end

  defp fetch_preferences(person_id) do
    from(p in Person, where: p.id == ^person_id, select: p.preferences)
    |> Repo.one()
  end

  defp fetch_notifications(person_id) do
    preferences = fetch_preferences(person_id)
    map_get(preferences, "notifications") || %{}
  end

  defp map_get(map, key) when is_map(map) do
    case Map.fetch(map, key) do
      {:ok, value} -> value
      :error -> Map.get(map, String.to_atom(key))
    end
  end

  defp map_get(_, _), do: nil
end
