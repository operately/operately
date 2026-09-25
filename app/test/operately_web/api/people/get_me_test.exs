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

    test "includes self-edit permissions for guests", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:guest, type: :guest)
        |> Factory.log_in_person(:guest)

      assert {200, %{me: %{permissions: %{can_edit_profile: true}}}} = query(ctx.conn, [:people, :get_me], %{})
    end

    test "self-edit permissions respect company read-only restrictions", ctx do
      %{company_id: ctx.company.id, access_state: :read_only}
      |> Operately.Billing.CompanyBillingAccount.changeset()
      |> Repo.insert!()

      assert {200, %{me: %{permissions: %{can_edit_profile: false}}}} = query(ctx.conn, [:people, :get_me], %{})
    end

    test "it returns the current account's information", ctx do
      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{})

      assert data == expected_profile(ctx.person)
    end

    test "includes manager information when requested", ctx do
      manager = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      {:ok, me} = Operately.People.update_person(ctx.person, %{manager_id: manager.id})
      me = Operately.Repo.preload(me, [:manager])

      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{include_manager: true})

      assert data == expected_profile(me)
      assert data.manager == Serializer.serialize(manager, level: :essential)
    end

    test "when the account has no manager, it returns null even when requested", ctx do
      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{include_manager: true})

      assert data == expected_profile(ctx.person)
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

    test "it returns a saved language preference", ctx do
      {:ok, person} = Operately.People.update_person(ctx.person, %{language: "pt-BR"})

      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{})

      assert data.language == "pt-BR"
      assert person.language == "pt-BR"
    end

    test "it returns null language when no preference is saved", ctx do
      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{})

      assert data.language == nil
    end

    test "it returns a dismissed product release id when set", ctx do
      {:ok, person} =
        Operately.People.update_person(ctx.person, %{
          preferences: %{
            dismissed_product_release_id: "v1.8"
          }
        })

      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{})

      assert data.dismissed_product_release_id == "v1.8"
      assert Operately.People.Person.dismissed_product_release_id(person) == "v1.8"
    end

    test "it returns null for dismissed product release id when missing", ctx do
      assert {200, %{me: data}} = query(ctx.conn, [:people, :get_me], %{})

      assert data.dismissed_product_release_id == nil
    end
  end

  defp expected_profile(person) do
    person
    |> Serializer.serialize(level: :full)
    |> Map.put(:permissions, %{can_edit_profile: true, __typename: "person_permissions"})
  end
end
