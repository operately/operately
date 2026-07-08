defmodule OperatelyWeb.Api.People.GetMeTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:people, :get_me], %{})
    end
  end

  describe "get_me functionality" do
    setup :register_and_log_in_account

    test "it returns the current account's information", ctx do
      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{})

      assert data == Serializer.serialize(ctx.person, level: :full, me: true)
    end

    test "includes manager information when requested", ctx do
      manager = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      {:ok, me} = Operately.People.update_person(ctx.person, %{manager_id: manager.id})
      me = Operately.Repo.preload(me, [:manager])

      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{include_manager: true})

      assert data == Serializer.serialize(me, level: :full, me: true)
      assert data.manager == Serializer.serialize(manager, level: :essential)
    end

    test "when the account has no manager, it returns null even when requested", ctx do
      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{include_manager: true})

      assert data == Serializer.serialize(ctx.person, level: :full, me: true)
      assert data.manager == nil
    end

    test "it returns custom notification preference settings", ctx do
      {:ok, person} =
        Operately.People.update_person(ctx.person, %{
          preferences: %{
            notifications: %{
              email_window_minutes: 30,
              notify_on_mention: false,
              send_daily_summary: false,
              daily_summary_delivery_time: "09:00"
            }
          }
        })

      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{})

      assert data.email_preference == "buffered"
      assert data.email_window_minutes == 30
      refute data.notify_on_mention
      refute data.send_daily_summary
      assert data.daily_summary_delivery_time == "09:00"
      assert Operately.People.Person.email_preference(person) == :buffered
    end

    test "it returns custom display preference settings", ctx do
      {:ok, person} =
        Operately.People.update_person(ctx.person, %{
          preferences: %{
            time_format: "hour_24"
          }
        })

      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{})

      assert data.time_format == "hour_24"
      assert Operately.People.Person.time_format(person) == :hour_24
    end
  end
end
