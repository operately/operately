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

      assert data == %{
        id: Paths.person_id(ctx.person),
        full_name: ctx.person.full_name,
        email: ctx.person.email,
        type: Atom.to_string(ctx.person.type),
        title: ctx.person.title,
        avatar_url: ctx.person.avatar_url,
        avatar_blob_id: ctx.person.avatar_blob_id,
        timezone: ctx.person.timezone,
        email_preference: "buffered",
        email_window_minutes: 5,
        send_daily_summary: Operately.People.Person.send_daily_summary?(ctx.person),
        notify_on_mention: Operately.People.Person.notify_on_mention?(ctx.person),
        notify_about_assignments: Operately.People.Person.notify_about_assignments?(ctx.person),
        description: nil,
        manager: nil,
        show_dev_bar: false,
      }
    end

    test "includes manager information when requested", ctx do
      manager = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      {:ok, me} = Operately.People.update_person(ctx.person, %{manager_id: manager.id})

      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{include_manager: true})

      assert data == %{
        id: Paths.person_id(ctx.person),
        full_name: me.full_name,
        email: me.email,
        type: Atom.to_string(me.type),
        title: ctx.person.title,
        avatar_url: ctx.person.avatar_url,
        avatar_blob_id: ctx.person.avatar_blob_id,
        timezone: me.timezone,
        email_preference: "buffered",
        email_window_minutes: 5,
        send_daily_summary: Operately.People.Person.send_daily_summary?(me),
        notify_on_mention: Operately.People.Person.notify_on_mention?(me),
        notify_about_assignments: Operately.People.Person.notify_about_assignments?(me),
        description: nil,
        show_dev_bar: false,
        manager: %{
          id: Paths.person_id(manager),
          full_name: manager.full_name,
          email: manager.email,
          type: Atom.to_string(manager.type),
          title: manager.title,
          avatar_url: nil,
        },
      }
    end

    test "when the account has no manager, it returns null even when requested", ctx do
      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{include_manager: true})

      assert data == %{
        id: Paths.person_id(ctx.person),
        full_name: ctx.person.full_name,
        email: ctx.person.email,
        type: Atom.to_string(ctx.person.type),
        title: ctx.person.title,
        avatar_url: ctx.person.avatar_url,
        avatar_blob_id: ctx.person.avatar_blob_id,
        timezone: ctx.person.timezone,
        email_preference: "buffered",
        email_window_minutes: 5,
        send_daily_summary: Operately.People.Person.send_daily_summary?(ctx.person),
        notify_on_mention: Operately.People.Person.notify_on_mention?(ctx.person),
        notify_about_assignments: Operately.People.Person.notify_about_assignments?(ctx.person),
        description: nil,
        show_dev_bar: false,
        manager: nil
      }
    end

    test "it returns custom notification preference settings", ctx do
      {:ok, person} =
        Operately.People.update_person(ctx.person, %{
          preferences: %{
            notifications: %{
              email_preference: :mentions_only,
              email_window_minutes: 30,
              send_daily_summary: false
            }
          }
        })

      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{})

      assert data.email_preference == "mentions_only"
      assert data.email_window_minutes == 30
      refute data.send_daily_summary
      assert Operately.People.Person.email_preference(person) == :mentions_only
    end
  end
end
