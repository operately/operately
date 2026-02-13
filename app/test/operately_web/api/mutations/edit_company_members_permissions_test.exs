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
    @table [
      %{access_level: :no_access, expected: 404},
      %{access_level: :comment_access, expected: 403},
      %{access_level: :edit_access, expected: 403},
      %{access_level: :admin_access, expected: 200},
      %{access_level: :full_access, expected: 200}
    ]

    setup :register_and_log_in_account

    tabletest @table do
      test "if caller has access_level=#{@test.access_level}, then expect code=#{@test.expected}", ctx do
        person = person_fixture(%{company_id: ctx.company.id})
        set_caller_access_level(ctx, @test.access_level)

        assert {code, res} = mutation(ctx.conn, :edit_company_members_permissions, %{
          members: [%{
            id: Paths.person_id(person),
            access_level: "edit_access",
          }],
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
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
          access_level: "edit_access",
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
            access_level: "edit_access",
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
          %{id: Paths.person_id(p1), access_level: "view_access"},
          %{id: Paths.person_id(p2), access_level: "edit_access"},
          %{id: Paths.person_id(p3), access_level: "full_access"},
        ],
      })

      assert_member_access_level(ctx.company, p1, Binding.view_access())
      assert_member_access_level(ctx.company, p2, Binding.edit_access())
      assert_member_access_level(ctx.company, p3, Binding.full_access())
    end
  end

  describe "access level validation" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_admin(:admin)
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:admin)
    end

    test "admin cannot grant access higher than admin", ctx do
      assert {403, res} = mutation(ctx.conn, :edit_company_members_permissions, %{
        members: [%{
          id: Paths.person_id(ctx.member),
          access_level: "full_access",
        }],
      })

      assert res.message == "You don't have permission to perform this action"
    end

    test "admin can grant access equal to or lower than admin", ctx do
      p1 = person_fixture(%{company_id: ctx.company.id})
      p2 = person_fixture(%{company_id: ctx.company.id})
      p3 = person_fixture(%{company_id: ctx.company.id})

      assert {200, res} = mutation(ctx.conn, :edit_company_members_permissions, %{
        members: [
          %{id: Paths.person_id(p1), access_level: "view_access"},
          %{id: Paths.person_id(p2), access_level: "comment_access"},
          %{id: Paths.person_id(p3), access_level: "admin_access"},
        ],
      })

      assert res.success

      assert_member_access_level(ctx.company, p1, Binding.view_access())
      assert_member_access_level(ctx.company, p2, Binding.comment_access())
      assert_member_access_level(ctx.company, p3, Binding.admin_access())
    end

    test "full_access can grant any access level", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      p1 = person_fixture(%{company_id: ctx.company.id})
      p2 = person_fixture(%{company_id: ctx.company.id})
      p3 = person_fixture(%{company_id: ctx.company.id})
      p4 = person_fixture(%{company_id: ctx.company.id})

      assert {200, res} = mutation(ctx.conn, :edit_company_members_permissions, %{
        members: [
          %{id: Paths.person_id(p1), access_level: "view_access"},
          %{id: Paths.person_id(p2), access_level: "comment_access"},
          %{id: Paths.person_id(p3), access_level: "admin_access"},
          %{id: Paths.person_id(p4), access_level: "full_access"},
        ],
      })

      assert res.success

      assert_member_access_level(ctx.company, p1, Binding.view_access())
      assert_member_access_level(ctx.company, p2, Binding.comment_access())
      assert_member_access_level(ctx.company, p3, Binding.admin_access())
      assert_member_access_level(ctx.company, p4, Binding.full_access())
    end

    test "rejects when any member in batch has higher access than caller", ctx do
      p1 = person_fixture(%{company_id: ctx.company.id})
      p2 = person_fixture(%{company_id: ctx.company.id})
      p3 = person_fixture(%{company_id: ctx.company.id})

      assert {403, res} = mutation(ctx.conn, :edit_company_members_permissions, %{
        members: [
          %{id: Paths.person_id(p1), access_level: "view_access"},
          %{id: Paths.person_id(p2), access_level: "full_access"},
          %{id: Paths.person_id(p3), access_level: "edit_access"},
        ],
      })

      assert res.message == "You don't have permission to perform this action"
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

  defp set_caller_access_level(ctx, :no_access) do
    Access.get_group!(company_id: ctx.company.id, tag: :standard)
    |> Repo.delete()

    ctx
  end

  defp set_caller_access_level(ctx, access_level) when access_level in [:comment_access, :edit_access, :admin_access, :full_access] do
    binding_level = case access_level do
      :comment_access -> Binding.comment_access()
      :edit_access -> Binding.edit_access()
      :admin_access -> Binding.admin_access()
      :full_access -> Binding.full_access()
    end

    Factory.set_company_access_level(ctx, :person, binding_level)
  end
end
