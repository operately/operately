defmodule OperatelyWeb.Api.Queries.GetMeTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_me, %{})
    end
  end

  describe "get_me functionality" do
    setup :register_and_log_in_account

    test "it returns the current account's information", ctx do
      assert {200, %{me: data}} = query(ctx.conn, :get_me, %{})

      assert data == %{
        id: ctx.person.id,
        full_name: ctx.person.full_name,
        email: ctx.person.email,
        title: ctx.person.title,
        avatar_url: ctx.person.avatar_url,
        avatar_blob_id: ctx.person.avatar_blob_id,
        timezone: ctx.person.timezone,
        send_daily_summary: ctx.person.send_daily_summary,
        notify_on_mention: ctx.person.notify_on_mention,
        notify_about_assignments: ctx.person.notify_about_assignments,
        companyRole: Atom.to_string(ctx.person.company_role),
        theme: "system",
        manager: nil,
      }
    end

    test "includes manager information when requested", ctx do
      manager = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      {:ok, me} = Operately.People.update_person(ctx.person, %{manager_id: manager.id})

      assert {200, %{me: data}} = query(ctx.conn, :get_me, %{include_manager: true})

      assert data == %{
        id: me.id,
        full_name: me.full_name,
        email: me.email,
        title: ctx.person.title,
        avatar_url: ctx.person.avatar_url,
        avatar_blob_id: ctx.person.avatar_blob_id,
        timezone: me.timezone,
        send_daily_summary: me.send_daily_summary,
        notify_on_mention: me.notify_on_mention,
        notify_about_assignments: me.notify_about_assignments,
        companyRole: Atom.to_string(me.company_role),
        theme: "system",
        manager: %{
          id: manager.id,
          full_name: manager.full_name,
          email: manager.email,
          title: manager.title,
          avatar_url: nil,
        },
      }
    end

    test "when the account has no manager, it returns null even when requested", ctx do
      assert {200, %{me: data}} = query(ctx.conn, :get_me, %{include_manager: true})

      assert data == %{
        id: ctx.person.id,
        full_name: ctx.person.full_name,
        email: ctx.person.email,
        title: ctx.person.title,
        avatar_url: ctx.person.avatar_url,
        avatar_blob_id: ctx.person.avatar_blob_id,
        timezone: ctx.person.timezone,
        send_daily_summary: ctx.person.send_daily_summary,
        notify_on_mention: ctx.person.notify_on_mention,
        notify_about_assignments: ctx.person.notify_about_assignments,
        companyRole: Atom.to_string(ctx.person.company_role),
        theme: "system",
        manager: nil
      }
    end
  end
end
