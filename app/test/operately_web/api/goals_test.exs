defmodule OperatelyWeb.Api.GoalsTest do
  alias Operately.Support.RichText
  alias Operately.ContextualDates.Timeframe
  alias Operately.Access
  alias Operately.Access.Binding

  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  @full_access_table [
    %{company: :no_access,      space: :no_access,      goal: :no_access,      expected: 404},
    %{company: :no_access,      space: :no_access,      goal: :comment_access, expected: 403},
    %{company: :no_access,      space: :no_access,      goal: :edit_access,    expected: 403},
    %{company: :no_access,      space: :no_access,      goal: :full_access,    expected: 200},

    %{company: :no_access,      space: :comment_access, goal: :no_access,      expected: 403},
    %{company: :no_access,      space: :edit_access,    goal: :no_access,      expected: 403},
    %{company: :no_access,      space: :full_access,    goal: :no_access,      expected: 200},

    %{company: :comment_access, space: :no_access,      goal: :no_access,      expected: 403},
    %{company: :edit_access,    space: :no_access,      goal: :no_access,      expected: 403},
    %{company: :full_access,    space: :no_access,      goal: :no_access,      expected: 200},
  ]

  @edit_access_table [
    %{company: :no_access,      space: :no_access,      goal: :no_access,      expected: 404},
    %{company: :no_access,      space: :no_access,      goal: :comment_access, expected: 403},
    %{company: :no_access,      space: :no_access,      goal: :edit_access,    expected: 200},
    %{company: :no_access,      space: :no_access,      goal: :full_access,    expected: 200},

    %{company: :no_access,      space: :comment_access, goal: :no_access,      expected: 403},
    %{company: :no_access,      space: :edit_access,    goal: :no_access,      expected: 200},
    %{company: :no_access,      space: :full_access,    goal: :no_access,      expected: 200},

    %{company: :comment_access, space: :no_access,      goal: :no_access,      expected: 403},
    %{company: :edit_access,    space: :no_access,      goal: :no_access,      expected: 200},
    %{company: :full_access,    space: :no_access,      goal: :no_access,      expected: 200},
  ]

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal, :marketing)
  end

  describe "count children" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:goals, :count_children], %{})
    end

    test "it requires an id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:goals, :count_children], %{})
      assert res.message == "Missing required fields: id"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = query(ctx.conn, [:goals, :count_children], %{
        id: Ecto.UUID.generate()
      })
    end

    test "it returns counts for goal", ctx do
      ctx =
        ctx
        |> Factory.add_goal_discussion(:discussion1, :goal)
        |> Factory.add_goal_discussion(:discussion2, :goal)
        |> Factory.add_goal_update(:check_in1, :goal, :creator)
        |> Factory.fetch_default_goal_resource_hub(:hub, :goal)
        |> Factory.add_folder(:folder, :hub)
        |> Factory.add_document(:doc1, :hub)
        |> Factory.add_file(:file1, :hub)
        |> Factory.add_link(:link1, :hub)
        |> Factory.add_document(:nested_doc, :hub, folder: :folder)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:goals, :count_children], %{
        id: Paths.goal_id(ctx.goal)
      })

      assert res.children_count.discussions_count == 2
      assert res.children_count.check_ins_count == 1
      assert res.children_count.docs_and_files_count == 4
    end

    test "it returns 0 counts when goal has no children", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:goals, :count_children], %{
        id: Paths.goal_id(ctx.goal)
      })

      assert res.children_count.discussions_count == 0
      assert res.children_count.check_ins_count == 0
      assert res.children_count.docs_and_files_count == 0
    end

    test "it counts own drafts but excludes other people's drafts", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:other_member, :marketing)
        |> Factory.fetch_default_goal_resource_hub(:hub, :goal)
        |> Factory.add_document(:published, :hub)
        |> Factory.add_document(:own_draft, :hub, state: :draft)
        |> Factory.add_document(:other_draft, :hub, author: :other_member, state: :draft)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:goals, :count_children], %{
        id: Paths.goal_id(ctx.goal)
      })

      assert res.children_count.docs_and_files_count == 2

      ctx = Factory.log_in_person(ctx, :other_member)

      assert {200, other_res} = query(ctx.conn, [:goals, :count_children], %{
        id: Paths.goal_id(ctx.goal)
      })

      assert other_res.children_count.docs_and_files_count == 2
    end
  end

  describe "update access levels" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_access_levels], %{})
    end

    test "it requires a goal_id and access_levels", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_access_levels], %{})
      assert res.message == "Missing required fields: goal_id, access_levels"
    end

    test "it updates access levels", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        access_levels: %{
          company: 0,
          space: 100
        }
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_access_levels], inputs)
      assert res.success == true
    end
  end

  describe "update access levels - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @full_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_access_levels], %{
          goal_id: Paths.goal_id(goal),
          access_levels: %{company: 0, space: 100}
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "list access members" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:goals, :list_access_members], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:goals, :list_access_members], %{})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      goal_id = Ecto.UUID.generate() |> Paths.goal_id()
      assert {404, res} = query(ctx.conn, [:goals, :list_access_members], %{goal_id: goal_id})
      assert res.message == "Goal not found"
    end

    test "it requires access level editing permissions", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:editor, :marketing)
        |> Factory.log_in_person(:editor)

      assert {403, _} = query(ctx.conn, [:goals, :list_access_members], %{goal_id: Paths.goal_id(ctx.goal)})
    end

    test "it returns people with direct access", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:creator)

      context = Access.get_context!(goal_id: ctx.goal.id)
      {:ok, _} = Access.bind_person(context, ctx.member.id, Binding.edit_access())

      assert {200, res} = query(ctx.conn, [:goals, :list_access_members], %{goal_id: Paths.goal_id(ctx.goal)})

      assert_includes_person(res.people, ctx.member.id, :edit_access)
      assert_includes_person(res.people, ctx.creator.id, :full_access)
    end

    test "returns people with direct access bindings including champion and reviewer", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space)
        |> Factory.add_company_member(:member)
        |> Factory.add_company_member(:champion)
        |> Factory.add_company_member(:reviewer)
        |> Factory.add_goal(:goal_with_roles, :space, champion: :champion, reviewer: :reviewer)
        |> Factory.log_in_person(:champion)

      context = Access.get_context!(goal_id: ctx.goal_with_roles.id)
      {:ok, _} = Access.bind_person(context, ctx.member.id, Binding.edit_access())

      assert {200, res} = query(ctx.conn, [:goals, :list_access_members], %{goal_id: Paths.goal_id(ctx.goal_with_roles)})

      assert length(res.people) == 4
      assert_includes_person(res.people, ctx.creator.id, :full_access)
      assert_includes_person(res.people, ctx.champion.id, :full_access)
      assert_includes_person(res.people, ctx.reviewer.id, :full_access)
      assert_includes_person(res.people, ctx.member.id, :edit_access)
    end
  end

  describe "create access members" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :create_access_members], %{})
    end

    test "it requires a goal_id and members", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :create_access_members], %{})
      assert res.message == "Missing required fields: goal_id, members"
    end

    test "it requires access level editing permissions", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:editor, :marketing)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:editor)

      assert {403, _} =
               mutation(ctx.conn, [:goals, :create_access_members], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 members: [%{id: Paths.person_id(ctx.member), access_level: Binding.edit_access()}]
               })

      refute direct_binding(ctx.goal, ctx.member)
    end

    test "it adds access members", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:creator)

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_access_members], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 members: [%{id: Paths.person_id(ctx.member), access_level: Binding.edit_access()}]
               })

      assert res.success == true
      assert_binding_access(ctx.goal, ctx.member, Binding.edit_access())
    end
  end

  describe "create access members - company boundary" do
    test "rejects people from another company without granting the rest of the batch", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)
      foreign = foreign_person()

      assert_members_rejected(ctx, [
        %{id: Paths.person_id(ctx.member), access_level: Binding.full_access()},
        %{id: Paths.person_id(foreign), access_level: Binding.edit_access()}
      ])

      refute direct_binding(ctx.goal, ctx.member)
      refute direct_binding(ctx.goal, foreign)
    end

    test "rejects a mixed batch without changing an existing access level", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)
      foreign = foreign_person()
      context = Access.get_context!(goal_id: ctx.goal.id)
      {:ok, binding} = Access.bind_person(context, ctx.member.id, Binding.comment_access())

      assert_members_rejected(ctx, [
        %{id: Paths.person_id(ctx.member), access_level: Binding.full_access()},
        %{id: Paths.person_id(foreign), access_level: Binding.edit_access()}
      ])

      unchanged = direct_binding(ctx.goal, ctx.member)
      assert unchanged.id == binding.id
      assert unchanged.access_level == Binding.comment_access()
      assert unchanged.updated_at == binding.updated_at
      refute direct_binding(ctx.goal, foreign)
    end

    test "rejects a missing person without granting the rest of the batch", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)

      assert_members_rejected(ctx, [
        %{id: Paths.person_id(ctx.member), access_level: Binding.edit_access()},
        %{id: Ecto.UUID.generate(), access_level: Binding.view_access()}
      ])

      refute direct_binding(ctx.goal, ctx.member)
    end

    for suspension_field <- [:suspended, :suspended_at] do
      test "rejects a person with #{suspension_field} set without granting the rest of the batch", ctx do
        ctx = ctx |> Factory.add_company_member(:member) |> Factory.add_company_member(:suspended_member) |> Factory.log_in_person(:creator)
        suspended = suspend_person(ctx.suspended_member, unquote(suspension_field))

        assert_members_rejected(ctx, [
          %{id: Paths.person_id(ctx.member), access_level: Binding.edit_access()},
          %{id: Paths.person_id(suspended), access_level: Binding.comment_access()}
        ])

        refute direct_binding(ctx.goal, ctx.member)
        refute direct_binding(ctx.goal, suspended)
      end
    end

    test "rejects the foreign person record of a shared account", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)
      foreign = same_account_foreign_person(ctx.member)

      assert ctx.member.account_id == foreign.account_id
      assert_members_rejected(ctx, [%{id: Paths.person_id(foreign), access_level: Binding.edit_access()}])
      refute direct_binding(ctx.goal, foreign)
    end

    test "accepts the local person record of a shared account", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)
      _foreign = same_account_foreign_person(ctx.member)

      assert {200, %{success: true}} = mutation(ctx.conn, [:goals, :create_access_members], member_input(ctx, ctx.member, Binding.edit_access()))
      assert_binding_access(ctx.goal, ctx.member, Binding.edit_access())
    end

    test "rejects a goal from another company even when the caller has a binding and every person is local", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)
      other = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
      context = Access.get_context!(goal_id: other.goal.id)
      {:ok, caller_binding} = Access.bind_person(context, ctx.creator.id, Binding.full_access())

      before = access_snapshot(ctx.goal)
      other_bindings = goal_bindings(other.goal)

      assert {404, res} =
               mutation(ctx.conn, [:goals, :create_access_members], %{
                 goal_id: Paths.goal_id(other.goal),
                 members: [%{id: Paths.person_id(ctx.member), access_level: Binding.edit_access()}]
               })

      assert res.message == "Goal not found"
      assert access_snapshot(ctx.goal) == before
      assert goal_bindings(other.goal) == other_bindings
      unchanged = direct_binding(other.goal, ctx.creator)
      assert unchanged.id == caller_binding.id
      assert unchanged.access_level == Binding.full_access()
      assert unchanged.updated_at == caller_binding.updated_at
      refute direct_binding(other.goal, ctx.member)
    end

    test "adds an active guest who is not a space member", ctx do
      ctx = ctx |> Factory.add_company_member(:guest) |> convert_to_guest(:guest) |> Factory.log_in_person(:creator)
      refute space_member?(ctx.marketing, ctx.guest)

      assert {200, %{success: true}} = mutation(ctx.conn, [:goals, :create_access_members], member_input(ctx, ctx.guest, Binding.full_access()))
      assert_binding_access(ctx.goal, ctx.guest, Binding.full_access())
      refute space_member?(ctx.marketing, ctx.guest)
    end

    test "lets an active guest with full access add a member outside caller-scoped visibility", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:guest)
        |> Factory.add_company_member(:member)
        |> convert_to_guest(:guest)

      context = Access.get_context!(goal_id: ctx.goal.id)
      {:ok, _} = Access.bind_person(context, ctx.guest.id, Binding.full_access())
      ctx = Factory.log_in_person(ctx, :guest)

      assert {:error, :not_found} = Operately.People.Person.get(ctx.guest, id: ctx.member.id)
      refute space_member?(ctx.marketing, ctx.member)

      assert {200, %{success: true}} = mutation(ctx.conn, [:goals, :create_access_members], member_input(ctx, ctx.member, Binding.edit_access()))
      assert_binding_access(ctx.goal, ctx.member, Binding.edit_access())
      refute space_member?(ctx.marketing, ctx.member)
    end

    test "accepts duplicate members and keeps the last access level", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)

      assert {200, %{success: true}} =
               mutation(ctx.conn, [:goals, :create_access_members], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 members: [
                   %{id: Paths.person_id(ctx.member), access_level: Binding.view_access()},
                   %{id: Paths.person_id(ctx.member), access_level: Binding.full_access()}
                 ]
               })

      assert_binding_access(ctx.goal, ctx.member, Binding.full_access())
    end

    test "accepts an empty members list without changing access", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      before = access_snapshot(ctx.goal)

      assert {200, %{success: true}} =
               mutation(ctx.conn, [:goals, :create_access_members], %{goal_id: Paths.goal_id(ctx.goal), members: []})

      assert access_snapshot(ctx.goal) == before
    end

    test "rejects a null member id without granting the rest of the batch", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)
      before = access_snapshot(ctx.goal)

      assert {400, _} =
               mutation(ctx.conn, [:goals, :create_access_members], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 members: [
                   %{id: Paths.person_id(ctx.member), access_level: Binding.edit_access()},
                   %{id: nil, access_level: Binding.view_access()}
                 ]
               })

      assert access_snapshot(ctx.goal) == before
      refute direct_binding(ctx.goal, ctx.member)
    end

    test "rejects a read-only company without granting access", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:creator)

      %{company_id: ctx.company.id, access_state: :read_only}
      |> Operately.Billing.CompanyBillingAccount.changeset()
      |> Repo.insert!()

      assert_members_rejected(ctx, [%{id: Paths.person_id(ctx.member), access_level: Binding.edit_access()}], 403)
      refute direct_binding(ctx.goal, ctx.member)
    end

    test "external write token cannot add a foreign person", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.add_api_token(:token, :creator, read_only: false)
      foreign = foreign_person()
      before = access_snapshot(ctx.goal)

      assert {400, res} =
               external_mutation(ctx.conn, ctx.token, "goals/create_access_members", %{
                 goal_id: Paths.goal_id(ctx.goal),
                 members: [
                   %{id: Paths.person_id(ctx.member), access_level: Binding.edit_access()},
                   %{id: Paths.person_id(foreign), access_level: Binding.view_access()}
                 ]
               })

      assert res.message == "The request was malformed"
      refute res.message =~ Paths.person_id(foreign)
      assert access_snapshot(ctx.goal) == before
      refute direct_binding(ctx.goal, ctx.member)
    end

    test "read-only API token cannot add members", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.add_api_token(:token, :creator, read_only: true)
      before = access_snapshot(ctx.goal)

      assert {403, response} =
               external_mutation(ctx.conn, ctx.token, "goals/create_access_members", member_input(ctx, ctx.member, Binding.edit_access()))

      assert response == "Read-only API tokens cannot execute mutations"
      assert access_snapshot(ctx.goal) == before
      refute direct_binding(ctx.goal, ctx.member)
    end

    test "internal API rejects an API token", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.add_api_token(:token, :creator, read_only: false)
      conn = Plug.Conn.put_req_header(ctx.conn, "authorization", "Bearer #{ctx.token}")
      before = access_snapshot(ctx.goal)

      assert {401, _} = mutation(conn, [:goals, :create_access_members], member_input(ctx, ctx.member, Binding.edit_access()))
      assert access_snapshot(ctx.goal) == before
      refute direct_binding(ctx.goal, ctx.member)
    end
  end

  describe "create access members - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      member = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator, member: member})
    end

    tabletest @full_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :create_access_members], %{
          goal_id: Paths.goal_id(goal),
          members: [%{id: Paths.person_id(ctx.member), access_level: Binding.edit_access()}]
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update access member" do
    setup ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:editor, :marketing)
        |> Factory.add_company_member(:member)

      context = Access.get_context!(goal_id: ctx.goal.id)
      {:ok, _} = Access.bind_person(context, ctx.member.id, Binding.view_access())

      {:ok, ctx}
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_access_member], %{})
    end

    test "it requires a goal_id, person_id and access_level", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_access_member], %{})
      assert res.message == "Missing required fields: goal_id, person_id, access_level"
    end

    test "it requires access level editing permissions", ctx do
      ctx = Factory.log_in_person(ctx, :editor)

      assert {403, _} =
               mutation(ctx.conn, [:goals, :update_access_member], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 person_id: Paths.person_id(ctx.member),
                 access_level: Binding.edit_access()
               })
    end

    test "it updates the access level", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert_binding_access(ctx.goal, ctx.member, Binding.view_access())

      assert {200, res} =
               mutation(ctx.conn, [:goals, :update_access_member], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 person_id: Paths.person_id(ctx.member),
                 access_level: Binding.edit_access()
               })

      assert res.success == true
      assert_binding_access(ctx.goal, ctx.member, Binding.edit_access())
    end
  end

  describe "update access member - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      member = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator, member: member})
    end

    tabletest @full_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        context = Access.get_context!(goal_id: goal.id)
        {:ok, _} = Access.bind_person(context, ctx.member.id, Binding.view_access())

        assert {code, res} = mutation(ctx.conn, [:goals, :update_access_member], %{
          goal_id: Paths.goal_id(goal),
          person_id: Paths.person_id(ctx.member),
          access_level: Binding.edit_access()
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "delete access member" do
    setup ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:editor, :marketing)
        |> Factory.add_company_member(:member)

      context = Access.get_context!(goal_id: ctx.goal.id)
      {:ok, _} = Access.bind_person(context, ctx.member.id, Binding.comment_access())

      {:ok, ctx}
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :delete_access_member], %{})
    end

    test "it requires a goal_id and person_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :delete_access_member], %{})
      assert res.message == "Missing required fields: goal_id, person_id"
    end

    test "it requires access level editing permissions", ctx do
      ctx = Factory.log_in_person(ctx, :editor)

      assert {403, _} =
               mutation(ctx.conn, [:goals, :delete_access_member], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 person_id: Paths.person_id(ctx.member)
               })
    end

    test "it deletes the access member", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} =
               mutation(ctx.conn, [:goals, :delete_access_member], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 person_id: Paths.person_id(ctx.member)
               })

      assert res.success == true
      refute direct_binding(ctx.goal, ctx.member)
    end
  end

  describe "delete access member - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      member = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator, member: member})
    end

    tabletest @full_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        context = Access.get_context!(goal_id: goal.id)
        {:ok, _} = Access.bind_person(context, ctx.member.id, Binding.comment_access())

        assert {code, res} = mutation(ctx.conn, [:goals, :delete_access_member], %{
          goal_id: Paths.goal_id(goal),
          person_id: Paths.person_id(ctx.member)
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update space" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_space], %{})
    end

    test "it requires a goal_id and space_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_space], %{})
      assert res.message == "Missing required fields: goal_id, space_id"
    end

    test "it does no action if the space didn't change", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      space = Repo.preload(ctx.goal, [:group]).group

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        space_id: Paths.space_id(space)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_space], inputs)
      assert res.success == true
    end

    test "it updates the space", ctx do
      ctx = Factory.add_space(ctx, :product)
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        space_id: Paths.space_id(ctx.product)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_space], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.group_id == ctx.product.id
    end
  end

  describe "update space - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @full_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        new_space = create_space(ctx)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_space], %{
          goal_id: Paths.goal_id(goal),
          space_id: Paths.space_id(new_space)
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update parent goal" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_parent_goal], %{})
    end

    test "it requires a goal_id and parent_goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_parent_goal], %{})
      assert res.message == "Missing required fields: goal_id, parent_goal_id"
    end

    test "it updates the parent goal", ctx do
      ctx = Factory.add_goal(ctx, :parent_goal, :marketing)
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        parent_goal_id: Paths.goal_id(ctx.parent_goal)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_parent_goal], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.parent_goal_id == ctx.parent_goal.id
    end

    test "it can remove the parent goal", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        parent_goal_id: nil
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_parent_goal], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.parent_goal_id == nil
    end
  end

  describe "update parent goal - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_parent_goal], %{
          goal_id: Paths.goal_id(goal),
          parent_goal_id: nil
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "search parent goal" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:goals, :search_parent_goal], %{query: ""})
    end

    test "it requires a goal_id and query", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:goals, :search_parent_goal], %{})
      assert res.message == "Missing required fields: query, goal_id"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      goal_id = Ecto.UUID.generate() |> Paths.goal_id()
      assert {404, res} = query(ctx.conn, [:goals, :search_parent_goal], %{goal_id: goal_id, query: ""})
      assert res.message == "Goal not found"
    end

    test "it returns potential parent goals", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal(ctx, :parent_goal1, :marketing)
      ctx = Factory.add_goal(ctx, :parent_goal2, :marketing)

      inputs = %{goal_id: Paths.goal_id(ctx.goal), query: ""}

      assert {200, res} = query(ctx.conn, [:goals, :search_parent_goal], inputs)
      assert length(res.goals) == 2
    end

    test "it filters by search term", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal(ctx, :parent_goal1, :marketing, name: "goal1")
      ctx = Factory.add_goal(ctx, :parent_goal2, :marketing, name: "goal2")

      inputs = %{goal_id: Paths.goal_id(ctx.goal), query: "goal1"}

      assert {200, res} = query(ctx.conn, [:goals, :search_parent_goal], inputs)
      assert length(res.goals) == 1
      assert hd(res.goals).id == Paths.goal_id(ctx.parent_goal1)
    end
  end

  describe "update name" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_name], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_name], %{name: "test"})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it requires a name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_name], %{goal_id: "test"})
      assert res.message == "Missing required fields: name"
    end

    test "it updates the name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:goals, :update_name], %{goal_id: Paths.goal_id(ctx.goal), name: "New Name"})
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.name == "New Name"
    end
  end

  describe "update name - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_name], %{
          goal_id: Paths.goal_id(goal),
          name: "Updated Name"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update description" do
    @content Jason.encode!(RichText.rich_text("Test"))

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_description], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_description], %{description: @content})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it requires a description", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_description], %{goal_id: "test"})
      assert res.message == "Missing required fields: description"
    end

    test "it updates the description", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:goals, :update_description], %{goal_id: Paths.goal_id(ctx.goal), description: @content})
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.description == Jason.decode!(@content)
    end
  end

  describe "update description - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_description], %{
          goal_id: Paths.goal_id(goal),
          description: Jason.encode!(RichText.rich_text("Test"))
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update due date" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_due_date], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_due_date], %{due_date: %{date: "2023-01-01", date_type: "day"}})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it updates the due date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_due_date], %{
        goal_id: Paths.goal_id(ctx.goal),
        due_date: contextual_date
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert Timeframe.end_date(ctx.goal.timeframe) == ~D[2026-01-01]
    end

    test "it can update the due date to nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:goals, :update_due_date], %{goal_id: Paths.goal_id(ctx.goal), due_date: nil})
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.timeframe.contextual_end_date == nil
    end
  end

  describe "update due date - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        contextual_date = %{
          date: "2026-01-01",
          date_type: "day",
          value: "Jan 1, 2026"
        }

        assert {code, res} = mutation(ctx.conn, [:goals, :update_due_date], %{
          goal_id: Paths.goal_id(goal),
          due_date: contextual_date
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update start date" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_start_date], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_start_date], %{start_date: %{date: "2023-01-01", date_type: "day"}})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it updates the start date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2025-01-01",
        date_type: "day",
        value: "Jan 1, 2025"
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_start_date], %{
        goal_id: Paths.goal_id(ctx.goal),
        start_date: contextual_date
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert Timeframe.start_date(ctx.goal.timeframe) == ~D[2025-01-01]
    end

    test "it can update the start date to nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:goals, :update_start_date], %{goal_id: Paths.goal_id(ctx.goal), start_date: nil})
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.timeframe.contextual_start_date == nil
    end
  end

  describe "update start date - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        contextual_date = %{
          date: "2025-01-01",
          date_type: "day",
          value: "Jan 1, 2025"
        }

        assert {code, res} = mutation(ctx.conn, [:goals, :update_start_date], %{
          goal_id: Paths.goal_id(goal),
          start_date: contextual_date
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "create target" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :create_target], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :create_target], %{})
      assert res.message == "Missing required fields: goal_id, name, start_value, target_value, unit"
    end

    test "it adds a target to the goal", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        name: "New Target",
        start_value: 0,
        target_value: 100,
        unit: "USD"
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :create_target], inputs)
      assert res.success == true

      target = Repo.get(Operately.Goals.Target, res.target_id)

      assert target.name == inputs.name
      assert target.from == inputs.start_value
      assert target.to == inputs.target_value
      assert target.unit == inputs.unit
      assert target.goal_id == ctx.goal.id
      assert target.value == inputs.start_value
    end
  end

  describe "create target - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :create_target], %{
          goal_id: Paths.goal_id(goal),
          name: "New Target",
          start_value: 0,
          target_value: 100,
          unit: "USD"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :target_id)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "delete target" do
    setup ctx do
      Factory.add_goal_target(ctx, :target, :goal)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :delete_target], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :delete_target], %{})
      assert res.message == "Missing required fields: goal_id, target_id"
    end

    test "it deletes the target", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Paths.target_id(ctx.target)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :delete_target], inputs)
      assert res.success == true

      assert Repo.get(Operately.Goals.Target, ctx.target.id) == nil
    end

    test "it returns 404 if target does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Ecto.UUID.generate() |> Paths.target_id()
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :delete_target], inputs)
      assert res.message == "Target not found"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        target_id: Paths.target_id(ctx.target)
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :delete_target], inputs)
      assert res.message == "Goal not found"
    end
  end

  describe "delete target - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        target = goal_target_fixture(goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :delete_target], %{
          goal_id: Paths.goal_id(goal),
          target_id: Paths.target_id(target)
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update target value" do
    setup ctx do
      Factory.add_goal_target(ctx, :target, :goal)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_target_value], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_target_value], %{})
      assert res.message == "Missing required fields: goal_id, target_id, value"
    end

    test "it returns 404 if target does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Ecto.UUID.generate() |> Paths.target_id(),
        value: 42
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target_value], inputs)
      assert res.message == "Target not found"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        target_id: Paths.target_id(ctx.target),
        value: 42
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target_value], inputs)
      assert res.message == "Goal not found"
    end

    test "it updates the target value", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Paths.target_id(ctx.target),
        value: 55
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_target_value], inputs)
      assert res.success == true

      target = Repo.get(Operately.Goals.Target, ctx.target.id)
      assert target.value == 55
    end
  end

  describe "update target value - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        target = goal_target_fixture(goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_target_value], %{
          goal_id: Paths.goal_id(goal),
          target_id: Paths.target_id(target),
          value: 42
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update target" do
    setup ctx do
      Factory.add_goal_target(ctx, :target, :goal)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_target], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_target], %{})
      assert res.message == "Missing required fields: goal_id, target_id"
    end

    test "it returns 404 if target does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Ecto.UUID.generate() |> Paths.target_id(),
        name: "Updated Target",
        start_value: 10,
        target_value: 200,
        unit: "EUR"
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target], inputs)
      assert res.message == "Target not found"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        target_id: Paths.target_id(ctx.target),
        name: "Updated Target",
        start_value: 10,
        target_value: 200,
        unit: "EUR"
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target], inputs)
      assert res.message == "Goal not found"
    end

    test "it updates the target", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Paths.target_id(ctx.target),
        name: "Updated Target",
        start_value: 10,
        target_value: 200,
        unit: "EUR"
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_target], inputs)
      assert res.success == true

      target = Repo.get(Operately.Goals.Target, ctx.target.id)
      assert target.name == "Updated Target"
      assert target.from == 10
      assert target.to == 200
      assert target.unit == "EUR"
    end

    test "it does not update the target when all attributes are nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      original_target = Repo.get(Operately.Goals.Target, ctx.target.id)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Paths.target_id(ctx.target)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_target], inputs)
      assert res.success == true

      target = Repo.get(Operately.Goals.Target, ctx.target.id)
      assert target.name == original_target.name
      assert target.from == original_target.from
      assert target.to == original_target.to
      assert target.unit == original_target.unit
      assert target.updated_at == original_target.updated_at
    end
  end

  describe "update target - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        target = goal_target_fixture(goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_target], %{
          goal_id: Paths.goal_id(goal),
          target_id: Paths.target_id(target),
          name: "Updated Target",
          start_value: 10,
          target_value: 200,
          unit: "EUR"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update target index" do
    setup ctx do
      targets = Operately.Repo.preload(ctx.goal, :targets).targets |> Enum.sort_by(& &1.index)

      ctx
      |> Map.put(:target1, Enum.at(targets, 0))
      |> Map.put(:target2, Enum.at(targets, 1))
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_target_index], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_target_index], %{})
      assert res.message == "Missing required fields: goal_id, target_id, index"
    end

    test "it returns 404 if target does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Ecto.UUID.generate() |> Paths.target_id(),
        index: 1
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target_index], inputs)
      assert res.message == "Target not found"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        target_id: Paths.target_id(ctx.target1),
        index: 1
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target_index], inputs)
      assert res.message == "Goal not found"
    end

    test "it updates the target index", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal_target(ctx, :target3, :goal)
      ctx = Factory.reload(ctx, :goal)

      inputs = %{goal_id: Paths.goal_id(ctx.goal), target_id: Paths.target_id(ctx.target3)}

      # moving target3 to the first position
      assert {200, res} = mutation(ctx.conn, [:goals, :update_target_index], Map.put(inputs, :index, 0))
      assert res.success == true
      assert target_order(ctx.goal.id) == [ctx.target3.id, ctx.target1.id, ctx.target2.id]

      # moving target3 to the second position
      assert {200, res} = mutation(ctx.conn, [:goals, :update_target_index], Map.put(inputs, :index, 1))
      assert res.success == true
      assert target_order(ctx.goal.id) == [ctx.target1.id, ctx.target3.id, ctx.target2.id]

      # moving target3 to the last position
      assert {200, res} = mutation(ctx.conn, [:goals, :update_target_index], Map.put(inputs, :index, 2))
      assert res.success == true
      assert target_order(ctx.goal.id) == [ctx.target1.id, ctx.target2.id, ctx.target3.id]
    end

    defp target_order(goal_id) do
      from(t in Operately.Goals.Target, where: t.goal_id == ^goal_id)
      |> Operately.Repo.all()
      |> Enum.sort_by(& &1.index)
      |> Enum.map(& &1.id)
    end
  end

  describe "update target index - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        target = goal_target_fixture(goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_target_index], %{
          goal_id: Paths.goal_id(goal),
          target_id: Paths.target_id(target),
          index: 0
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update champion" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_champion], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_champion], %{champion_id: "test"})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it updates the champion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_company_member(ctx, :new_champion)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        champion_id: Paths.person_id(ctx.new_champion)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_champion], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.champion_id == ctx.new_champion.id
    end

    test "it can remove the champion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        champion_id: nil
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_champion], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.champion_id == nil
    end
  end

  describe "update champion - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @full_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_champion], %{
          goal_id: Paths.goal_id(goal),
          champion_id: nil
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  describe "update_reviewer" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_reviewer], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_reviewer], %{reviewer_id: "test"})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it updates the reviewer", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_company_member(ctx, :new_reviewer)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        reviewer_id: Paths.person_id(ctx.new_reviewer)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_reviewer], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.reviewer_id == ctx.new_reviewer.id
    end

    test "it can remove the reviewer", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        reviewer_id: nil
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_reviewer], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.reviewer_id == nil
    end
  end

  describe "update reviewer - permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @full_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, [:goals, :update_reviewer], %{
          goal_id: Paths.goal_id(goal),
          reviewer_id: nil
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Goal not found"
        end
      end
    end
  end

  defp assert_includes_person(people, person_id, access_level) do
    person = Operately.People.get_person!(person_id)
    returned_person = Enum.find(people, fn p -> p.id == Paths.person_id(person) end)

    assert returned_person != nil
    assert returned_person.access_level == Binding.from_atom(access_level)
  end

  defp direct_binding(goal, person) do
    context = Access.get_context!(goal_id: goal.id)
    group = Access.get_group!(person_id: person.id)

    Access.get_binding(context_id: context.id, group_id: group.id)
  end

  defp assert_binding_access(goal, person, access_level) do
    binding = direct_binding(goal, person)

    assert binding
    assert binding.access_level == access_level
  end

  defp member_input(ctx, person, access_level) do
    %{
      goal_id: Paths.goal_id(ctx.goal),
      members: [%{id: Paths.person_id(person), access_level: access_level}]
    }
  end

  defp assert_members_rejected(ctx, members, status \\ 400) do
    before = access_snapshot(ctx.goal)

    assert {^status, res} =
             mutation(ctx.conn, [:goals, :create_access_members], %{
               goal_id: Paths.goal_id(ctx.goal),
               members: members
             })

    if status == 400 do
      assert res.message == "The request was malformed"
      refute Enum.any?(members, fn member -> is_binary(member.id) && res.message =~ member.id end)
    end

    assert access_snapshot(ctx.goal) == before
  end

  defp goal_bindings(goal) do
    context = Access.get_context!(goal_id: goal.id)

    from(b in Operately.Access.Binding, where: b.context_id == ^context.id, order_by: b.id)
    |> Repo.all()
    |> Enum.map(&{&1.id, &1.group_id, &1.access_level, &1.updated_at})
  end

  defp access_snapshot(goal) do
    goal = Repo.get!(Operately.Goals.Goal, goal.id)

    %{
      counts: Enum.map(unchanged_schemas(), &Repo.aggregate(&1, :count)),
      champion_id: goal.champion_id,
      reviewer_id: goal.reviewer_id
    }
  end

  defp unchanged_schemas do
    [
      Operately.Goals.Goal,
      Operately.Projects.Contributor,
      Operately.Access.Binding,
      Operately.Access.GroupMembership,
      Operately.Groups.Member,
      Operately.Notifications.Subscription,
      Operately.Notifications.SubscriptionList,
      Operately.Activities.Activity
    ]
  end

  defp foreign_person(attrs \\ %{}) do
    other = Factory.setup(%{})

    Operately.PeopleFixtures.person_fixture(Map.merge(%{company_id: other.company.id, full_name: "Foreign Person", email: Operately.PeopleFixtures.unique_account_email()}, attrs))
  end

  defp same_account_foreign_person(person) do
    account = Repo.get!(Operately.People.Account, person.account_id)
    foreign_person(%{account_id: account.id, email: account.email, full_name: person.full_name})
  end

  defp suspend_person(person, :suspended) do
    person |> Ecto.Changeset.change(suspended: true) |> Repo.update!()
  end

  defp suspend_person(person, :suspended_at) do
    person
    |> Ecto.Changeset.change(suspended_at: DateTime.utc_now() |> DateTime.truncate(:second))
    |> Repo.update!()
  end

  defp convert_to_guest(ctx, key) do
    {:ok, guest} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.creator, Map.fetch!(ctx, key))
    Map.put(ctx, key, guest)
  end

  defp space_member?(space, person) do
    Repo.exists?(from m in Operately.Groups.Member, where: m.group_id == ^space.id and m.person_id == ^person.id)
  end

  #
  # Helpers for permissions tests
  #

  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  def create_goal(ctx, space, company_members_level, space_members_level, goal_member_level) do
    goal_attrs = %{
      space_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    }

    goal = goal_fixture(ctx.creator, goal_attrs)

    if goal_member_level != :no_access do
      context = Access.get_context!(goal_id: goal.id)
      {:ok, _} = Access.bind_person(context, ctx.person.id, Binding.from_atom(goal_member_level))
    end

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    Operately.Repo.preload(goal, :access_context)
  end
end
