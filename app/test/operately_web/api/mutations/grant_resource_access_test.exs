defmodule OperatelyWeb.Api.Mutations.GrantResourceAccessTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :grant_resource_access, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      expected: 403},
      %{company: :view_access,    expected: 403},
      %{company: :comment_access, expected: 403},
      %{company: :edit_access,    expected: 403},
      %{company: :admin_access,   expected: 200},
      %{company: :full_access,    expected: 200},
    ]

    setup ctx do
      ctx
      |> register_and_log_in_account()
      |> Factory.add_company_owner(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_outside_collaborator(:guest, :creator)
    end

    tabletest @table do
      test "if caller has company=#{@test.company}, then expect code=#{@test.expected}", ctx do
        ctx = Factory.set_company_access_level(ctx, :person, Binding.from_atom(@test.company))

        assert {code, res} = mutation(ctx.conn, :grant_resource_access, %{
          person_id: ctx.guest.id,
          resources: [
            %{resource_type: "space", resource_id: Paths.space_id(ctx.space), access_level: "edit_access"},
          ],
        })
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert res.success
          403 ->
            assert res.message == "You don't have permission to perform this action"
        end
      end
    end
  end

  describe "grant_resource_access functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_outside_collaborator(:guest, :creator)
      |> Factory.log_in_person(:creator)
    end

    test "grants access to a space", ctx do
      assert {200, res} = mutation(ctx.conn, :grant_resource_access, %{
        person_id: ctx.guest.id,
        resources: [
          %{resource_type: "space", resource_id: Paths.space_id(ctx.space), access_level: "edit_access"},
        ],
      })

      assert res.success

      context = Access.get_context!(group_id: ctx.space.id)
      binding = Access.get_binding(context, person_id: ctx.guest.id)

      assert binding
      assert binding.access_level == Binding.edit_access()
    end

    test "grants access to a goal", ctx do
      assert {200, res} = mutation(ctx.conn, :grant_resource_access, %{
        person_id: ctx.guest.id,
        resources: [
          %{resource_type: "goal", resource_id: Paths.goal_id(ctx.goal), access_level: "comment_access"},
        ],
      })

      assert res.success

      context = Access.get_context!(goal_id: ctx.goal.id)
      binding = Access.get_binding(context, person_id: ctx.guest.id)

      assert binding
      assert binding.access_level == Binding.comment_access()
    end

    test "grants access to a project", ctx do
      assert {200, res} = mutation(ctx.conn, :grant_resource_access, %{
        person_id: ctx.guest.id,
        resources: [
          %{resource_type: "project", resource_id: Paths.project_id(ctx.project), access_level: "view_access"},
        ],
      })

      assert res.success

      context = Access.get_context!(project_id: ctx.project.id)
      binding = Access.get_binding(context, person_id: ctx.guest.id)

      assert binding
      assert binding.access_level == Binding.view_access()
    end

    test "grants access to multiple resources at once", ctx do
      assert {200, res} = mutation(ctx.conn, :grant_resource_access, %{
        person_id: ctx.guest.id,
        resources: [
          %{resource_type: "space", resource_id: Paths.space_id(ctx.space), access_level: "edit_access"},
          %{resource_type: "goal", resource_id: Paths.goal_id(ctx.goal), access_level: "view_access"},
          %{resource_type: "project", resource_id: Paths.project_id(ctx.project), access_level: "full_access"},
        ],
      })

      assert res.success

      space_context = Access.get_context!(group_id: ctx.space.id)
      goal_context = Access.get_context!(goal_id: ctx.goal.id)
      project_context = Access.get_context!(project_id: ctx.project.id)

      assert Access.get_binding(space_context, person_id: ctx.guest.id).access_level == Binding.edit_access()
      assert Access.get_binding(goal_context, person_id: ctx.guest.id).access_level == Binding.view_access()
      assert Access.get_binding(project_context, person_id: ctx.guest.id).access_level == Binding.full_access()
    end
  end
end
