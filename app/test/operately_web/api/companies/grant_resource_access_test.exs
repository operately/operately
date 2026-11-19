defmodule OperatelyWeb.Api.Companies.GrantResourceAccessTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Access
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:companies, :grant_resource_access], %{})
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
        {:ok, _} = Access.bind_person(resource_context(:space, ctx.space), ctx.person.id, Binding.full_access())

        assert {code, res} = mutation(ctx.conn, [:companies, :grant_resource_access], %{
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
      assert {200, res} = mutation(ctx.conn, [:companies, :grant_resource_access], %{
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
      assert {200, res} = mutation(ctx.conn, [:companies, :grant_resource_access], %{
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
      assert {200, res} = mutation(ctx.conn, [:companies, :grant_resource_access], %{
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
      assert {200, res} = mutation(ctx.conn, [:companies, :grant_resource_access], %{
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

    test "accepts both UUID and short ID formats for person_id", ctx do
      # Test with UUID format
      assert {200, res} = mutation(ctx.conn, [:companies, :grant_resource_access], %{
        person_id: ctx.guest.id,
        resources: [
          %{resource_type: "space", resource_id: Paths.space_id(ctx.space), access_level: "view_access"},
        ],
      })

      assert res.success

      space_context = Access.get_context!(group_id: ctx.space.id)
      binding = Access.get_binding(space_context, person_id: ctx.guest.id)
      assert binding
      assert binding.access_level == Binding.view_access()

      # Test with short ID format
      assert {200, res} = mutation(ctx.conn, [:companies, :grant_resource_access], %{
        person_id: Paths.person_id(ctx.guest),
        resources: [
          %{resource_type: "project", resource_id: Paths.project_id(ctx.project), access_level: "edit_access"},
        ],
      })

      assert res.success

      project_context = Access.get_context!(project_id: ctx.project.id)
      binding = Access.get_binding(project_context, person_id: ctx.guest.id)
      assert binding
      assert binding.access_level == Binding.edit_access()
    end
  end

  describe "resource boundaries" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, company_permissions: 0)
      |> Factory.add_goal(:goal, :space, company_access: 0, space_access: 0)
      |> Factory.add_project(:project, :space, company_access_level: 0, space_access_level: 0)
      |> Factory.add_company_admin(:admin)
      |> Factory.add_outside_collaborator(:guest, :creator)
      |> Factory.log_in_person(:creator)
      |> Factory.add_api_token(:token, :creator, read_only: false)
    end

    for type <- [:space, :goal, :project] do
      @resource_type type

      test "rejects foreign #{@resource_type} resources before granting any batch entry", ctx do
        other = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space) |> Factory.add_project(:project, :space)
        resource = Map.fetch!(other, @resource_type)

        for already_accessible <- [false, true], person_id <- [ctx.creator.id, ctx.guest.id] do
          if already_accessible do
            {:ok, _} = Access.bind_person(resource_context(@resource_type, resource), ctx.creator.id, Binding.full_access())
          end

          before = grant_snapshot()
          inputs = %{person_id: person_id, resources: [grant(:space, ctx.space), grant(@resource_type, resource)]}
          assert {404, _} = mutation(ctx.conn, [:companies, :grant_resource_access], inputs)
          assert {404, _} = external_mutation(ctx.conn, ctx.token, "companies/grant_resource_access", inputs)
          assert grant_snapshot() == before
        end
      end

      test "rejects missing #{@resource_type} resources without partial grants", ctx do
        before = grant_snapshot()
        inputs = %{person_id: ctx.guest.id, resources: [grant(:space, ctx.space), grant(@resource_type, %{id: Ecto.UUID.generate()})]}

        assert {404, _} = mutation(ctx.conn, [:companies, :grant_resource_access], inputs)
        assert grant_snapshot() == before
      end

      test "requires access-management permissions on the selected #{@resource_type}", ctx do
        ctx = Factory.log_in_person(ctx, :admin)
        resource = Map.fetch!(ctx, @resource_type)
        inputs = %{person_id: ctx.guest.id, resources: [grant(@resource_type, resource)]}
        before = grant_snapshot()

        assert {404, _} = mutation(ctx.conn, [:companies, :grant_resource_access], inputs)
        assert grant_snapshot() == before

        {:ok, _} = Access.bind_person(resource_context(@resource_type, resource), ctx.admin.id, Binding.view_access())
        before = grant_snapshot()
        assert {403, _} = mutation(ctx.conn, [:companies, :grant_resource_access], inputs)
        assert grant_snapshot() == before
      end
    end

    test "rejects foreign and missing people, including another membership of the same account", ctx do
      other = Factory.setup(%{})
      same_account = other |> Map.put(:account, ctx.account) |> Factory.add_company_member(:person, account: :account)

      for person_id <- [other.creator.id, same_account.person.id, Ecto.UUID.generate()] do
        before = grant_snapshot()
        inputs = %{person_id: person_id, resources: [grant(:space, ctx.space), grant(:goal, ctx.goal), grant(:project, ctx.project)]}

        assert {400, _} = mutation(ctx.conn, [:companies, :grant_resource_access], inputs)
        assert {400, _} = external_mutation(ctx.conn, ctx.token, "companies/grant_resource_access", inputs)
        assert grant_snapshot() == before
      end
    end

    test "rejects either suspension field without creating grants", ctx do
      for attrs <- [%{suspended: true, suspended_at: nil}, %{suspended: false, suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)}] do
        ctx.guest |> Repo.reload() |> Ecto.Changeset.change(attrs) |> Repo.update!()
        before = grant_snapshot()
        assert {400, _} = mutation(ctx.conn, [:companies, :grant_resource_access], %{person_id: ctx.guest.id, resources: [grant(:project, ctx.project)]})
        assert grant_snapshot() == before
      end
    end

    test "project editors cannot grant more access than they have or change a higher-access person's binding", ctx do
      ctx = Factory.log_in_person(ctx, :admin)
      context = resource_context(:project, ctx.project)
      {:ok, _} = Access.bind_person(context, ctx.admin.id, Binding.edit_access())
      before = grant_snapshot()

      assert {403, _} = mutation(ctx.conn, [:companies, :grant_resource_access], %{person_id: ctx.guest.id, resources: [grant(:project, ctx.project, :full_access)]})
      assert grant_snapshot() == before

      {:ok, _} = Access.bind_person(context, ctx.guest.id, Binding.full_access())
      before = grant_snapshot()
      assert {403, _} = mutation(ctx.conn, [:companies, :grant_resource_access], %{person_id: ctx.guest.id, resources: [grant(:project, ctx.project, :view_access)]})
      assert grant_snapshot() == before
    end

    test "project editors can grant their own access level to an active guest", ctx do
      ctx = Factory.log_in_person(ctx, :admin)
      context = resource_context(:project, ctx.project)
      {:ok, _} = Access.bind_person(context, ctx.admin.id, Binding.edit_access())

      assert {200, _} = mutation(ctx.conn, [:companies, :grant_resource_access], %{person_id: ctx.guest.id, resources: [grant(:project, ctx.project, :edit_access)]})
      assert Access.get_binding(context, person_id: ctx.guest.id).access_level == Binding.edit_access()
    end

    test "valid external batches preserve duplicate-resource handling", ctx do
      inputs = %{person_id: ctx.guest.id, resources: [grant(:space, ctx.space), grant(:goal, ctx.goal), grant(:project, ctx.project, :view_access), grant(:project, ctx.project, :edit_access)]}
      assert {200, _} = external_mutation(ctx.conn, ctx.token, "companies/grant_resource_access", inputs)
      assert Access.get_binding(resource_context(:project, ctx.project), person_id: ctx.guest.id).access_level == Binding.edit_access()
      assert Repo.get_by(Operately.Groups.Member, group_id: ctx.space.id, person_id: ctx.guest.id)
      assert Repo.get_by(Operately.Projects.Contributor, project_id: ctx.project.id, person_id: ctx.guest.id)
    end

    test "read-only companies cannot grant access", ctx do
      {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
      {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now(), access_state_ends_at: nil})
      before = grant_snapshot()
      inputs = %{person_id: ctx.guest.id, resources: [grant(:project, ctx.project)]}

      assert {403, _} = mutation(ctx.conn, [:companies, :grant_resource_access], inputs)
      assert {403, _} = external_mutation(ctx.conn, ctx.token, "companies/grant_resource_access", inputs)
      assert grant_snapshot() == before
    end

    test "read-only tokens cannot grant access", ctx do
      ctx = Factory.add_api_token(ctx, :read_token, :creator, read_only: true)
      before = grant_snapshot()
      assert {403, _} = external_mutation(ctx.conn, ctx.read_token, "companies/grant_resource_access", %{person_id: ctx.guest.id, resources: [grant(:project, ctx.project)]})
      assert grant_snapshot() == before
    end
  end

  defp grant(type, resource, access_level \\ :full_access) do
    %{resource_type: Atom.to_string(type), resource_id: resource.id, access_level: Atom.to_string(access_level)}
  end

  defp resource_context(:space, resource), do: Access.get_context!(group_id: resource.id)
  defp resource_context(:goal, resource), do: Access.get_context!(goal_id: resource.id)
  defp resource_context(:project, resource), do: Access.get_context!(project_id: resource.id)

  defp grant_snapshot do
    [Binding, Operately.Access.GroupMembership, Operately.Groups.Member, Operately.Projects.Contributor, Operately.Notifications.Subscription, Operately.Activities.Activity]
    |> Map.new(fn schema -> {schema, Repo.all(from(row in schema, order_by: row.id))} end)
  end
end
