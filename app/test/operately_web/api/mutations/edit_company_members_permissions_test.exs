defmodule OperatelyWeb.Api.Mutations.EditCompanyMembersPermissionsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_company_members_permissions, %{})
    end
  end

  describe "permissions" do
    setup :register_and_log_in_account

    test "company members without full access can't edit members permissions", ctx do
      person = person_fixture(%{company_id: ctx.company.id})

      assert {403, res} = mutation(ctx.conn, :edit_company_members_permissions, %{
        members: [%{
          id: Paths.person_id(person),
          access_level: Binding.edit_access(),
        }],
      })
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with full access can edit members permissions", ctx do
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)
      person = person_fixture(%{company_id: ctx.company.id})

      assert {200, _} = mutation(conn, :edit_company_members_permissions, %{
        members: [%{
          id: Paths.person_id(person),
          access_level: Binding.edit_access(),
        }],
      })
    end
  end

  describe "edit_company_members_permissions functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      account = Repo.preload(ctx.company_creator, :account).account

      %{ctx | conn: log_in_account(ctx.conn, account)}
    end

    test "edits one member's access level", ctx do
      person = person_fixture(%{company_id: ctx.company.id})

      assert {200, res} = mutation(ctx.conn, :edit_company_members_permissions, %{
        members: [%{
          id: Paths.person_id(person),
          access_level: Binding.edit_access(),
        }],
      })
      assert res.success

      assert_member_access_level(ctx.company, person, Binding.edit_access())
    end

    test "edits multiple members' access levels", ctx do
      people = Enum.map(1..3, fn _ -> person_fixture(%{company_id: ctx.company.id}) end)

      assert {200, res} = mutation(ctx.conn, :edit_company_members_permissions, %{
        members: Enum.map(people, fn p ->
          %{
            id: Paths.person_id(p),
            access_level: Binding.edit_access(),
          }
        end),
      })
      assert res.success

      Enum.each(people, fn person ->
        assert_member_access_level(ctx.company, person, Binding.edit_access())
      end)
    end

    test "edits members to different access levels", ctx do
      p1 = person_fixture(%{company_id: ctx.company.id})
      p2 = person_fixture(%{company_id: ctx.company.id})
      p3 = person_fixture(%{company_id: ctx.company.id})

      assert {200, _} = mutation(ctx.conn, :edit_company_members_permissions, %{
        members: [
          %{id: Paths.person_id(p1), access_level: Binding.view_access()},
          %{id: Paths.person_id(p2), access_level: Binding.edit_access()},
          %{id: Paths.person_id(p3), access_level: Binding.full_access()},
        ],
      })

      assert_member_access_level(ctx.company, p1, Binding.view_access())
      assert_member_access_level(ctx.company, p2, Binding.edit_access())
      assert_member_access_level(ctx.company, p3, Binding.full_access())
    end
  end

  #
  # Helpers
  #

  defp assert_member_access_level(company, person, access_level) do
    context = Access.get_context!(company_id: company.id)
    group = Access.get_group!(person_id: person.id)

    assert Access.get_binding(context_id: context.id, group_id: group.id, access_level: access_level)
  end
end
