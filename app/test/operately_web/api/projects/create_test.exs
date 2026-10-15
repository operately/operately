defmodule OperatelyWeb.Api.Projects.CreateTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Access.Binding

  describe "projects/create destination authorization" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:actor)
      |> Factory.add_space(:source_space, company_permissions: Binding.edit_access())
      |> Factory.add_goal(:source_goal, :source_space, champion: :actor, reviewer: :actor)
      |> Factory.add_project(:source_project, :source_space)
      |> Factory.log_in_person(:actor)
    end

    for destination <- [:foreign, :foreign_accessible, :inaccessible, :missing] do
      @destination destination

      test "rejects #{@destination} parent before writes", ctx do
        destination_id =
          case @destination do
            scope when scope in [:foreign, :foreign_accessible] ->
              foreign = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)

              if scope == :foreign_accessible do
                context = Operately.Access.get_context!(goal_id: foreign.goal.id)
                {:ok, _} = Operately.Access.bind_person(context, ctx.actor.id, Binding.view_access())
              end

              foreign.goal.id

            :inaccessible ->
              other = ctx |> Factory.add_goal(:private_goal, :source_space, company_access: Binding.no_access(), space_access: Binding.no_access())
              other.private_goal.id

            :missing ->
              Ecto.UUID.generate()
          end

        counts = Enum.map([Operately.Goals.Goal, Operately.Projects.Project, Operately.Activities.Activity, Operately.Notifications.SubscriptionList], &Repo.aggregate(&1, :count))

        ctx = Factory.add_api_token(ctx, :destination_token, :actor, read_only: false)

        assert {404, _} =
                 mutation(ctx.conn, [:projects, :create], %{
                   space_id: ctx.source_space.id,
                   goal_id: destination_id,
                   name: "New project",
                   anonymous_access_level: 0,
                   company_access_level: 10,
                   space_access_level: 70
                 })

        assert {404, _} =
                 external_mutation(ctx.conn, ctx.destination_token, "projects/create", %{
                   space_id: ctx.source_space.id,
                   goal_id: destination_id,
                   name: "New project",
                   anonymous_access_level: 0,
                   company_access_level: 10,
                   space_access_level: 70
                 })

        assert Repo.reload(ctx.source_goal).parent_goal_id == nil
        assert Repo.reload(ctx.source_project).goal_id == nil
        assert Enum.map([Operately.Goals.Goal, Operately.Projects.Project, Operately.Activities.Activity, Operately.Notifications.SubscriptionList], &Repo.aggregate(&1, :count)) == counts
      end
    end

    test "accepts a visible parent in the same company", ctx do
      ctx = Factory.add_goal(ctx, :visible_parent, :source_space, company_access: Binding.view_access(), space_access: Binding.no_access())
      destination_id = ctx.visible_parent.id

      assert {200, _} =
               mutation(ctx.conn, [:projects, :create], %{
                 space_id: ctx.source_space.id,
                 goal_id: destination_id,
                 name: "New project",
                 anonymous_access_level: 0,
                 company_access_level: 10,
                 space_access_level: 70
               })
    end
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :create], %{})
    end
  end

  describe "company permissions" do
    @table [
      %{permissions: :view_access, expected: 403},
      %{permissions: :comment_access, expected: 403},
      %{permissions: :edit_access, expected: 200},
      %{permissions: :full_access, expected: 200},
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "company member with #{@test.permissions} can #{if @test.expected == 200, do: "create", else: "not create"} project", ctx do
        ctx = ctx
          |> Factory.add_space(:space, company_permissions: Binding.from_atom(@test.permissions))
          |> Factory.add_goal(:goal, :space)

        assert {code, res} = request(ctx.conn, ctx)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_project_created(res, ctx.space.id)
          403 ->
            assert res.message == "You don't have permission to perform this action"
        end
      end
    end
  end

  describe "space permissions" do
    @table [
      %{space: :no_access,      expected: 404},
      %{space: :view_access,    expected: 403},
      %{space: :comment_access, expected: 403},
      %{space: :edit_access,    expected: 200},
      %{space: :full_access,    expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})
      goal = goal_fixture(ctx.person, %{space_id: space.id})

      Map.merge(ctx, %{space: space, goal: goal})
    end

    tabletest @table do
      test "space member with #{@test.space} can #{if @test.expected == 200, do: "create", else: "not create"} project", ctx do
        add_person_to_space(ctx, Binding.from_atom(@test.space))

        assert {code, res} = request(ctx.conn, ctx)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_project_created(res, ctx.space.id)
          403 ->
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "create_project functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})
      goal = goal_fixture(ctx.person, %{space_id: space.id})

      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      Map.merge(ctx, %{space: space, goal: goal})
    end

    test "creates project within space", ctx do
      assert {200, res} = request(ctx.conn, ctx)
      assert_project_created(res, ctx.space.id)
    end

    test "creates project within company", ctx do
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = request(ctx.conn, ctx, space_id: Paths.space_id(space))
      assert_project_created(res, ctx.company.company_space_id)
    end

    test "forces company access level to no_access when space is private", ctx do
      private_space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
      goal = goal_fixture(ctx.person, %{space_id: private_space.id})

      assert {200, res} = request(ctx.conn, ctx,
               space_id: Paths.space_id(private_space),
               goal_id: Paths.goal_id(goal),
               company_access_level: Binding.full_access()
             )

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.project.id)
      context = Operately.Access.get_context!(project_id: id)
      company_group = Operately.Access.get_group!(company_id: ctx.company.id, tag: :standard)
      binding = Operately.Access.get_binding!(context_id: context.id, group_id: company_group.id)

      assert binding.access_level == Binding.no_access()
    end
  end

  #
  # Steps
  #

  defp request(conn, ctx, attrs \\ []) do
    mutation(conn, [:projects, :create], Enum.into(attrs, %{
      space_id: Paths.space_id(ctx.space),
      name: "project",
      reviewer_id: Paths.person_id(ctx.person),
      champion_id: Paths.person_id(ctx.person),
      goal_id: Paths.goal_id(ctx.goal),
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.view_access(),
      space_access_level: Binding.edit_access(),
    }))
  end

  defp assert_project_created(res, space_id) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.project.id)
    project = Operately.Projects.get_project!(id) |> Operately.Repo.preload(:resource_hub)
    assert project.group_id == space_id
    assert project.resource_hub
    assert project.resource_hub.project_id == project.id
    assert project.resource_hub.name == "Documents & Files"
  end

  #
  # Helpers
  #

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end

  describe "company member boundaries" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.log_in_person(:creator)
    end

    for role <- [:champion_id, :reviewer_id],
        invalid_owner <- [:other_company, :missing, :suspended, :suspended_at, :same_account] do
      test "rejects #{invalid_owner} #{role} without creating project records", ctx do
        owner_id = invalid_owner_id(ctx, unquote(invalid_owner))

        assert_unchanged(ctx, fn ->
          assert {400, _} = boundary_request(ctx, %{unquote(role) => owner_id})
        end)
      end
    end

    test "rejects a mixed batch when either owner is not an active company member", ctx do
      foreign_id = invalid_owner_id(ctx, :other_company)

      assert_unchanged(ctx, fn ->
        assert {400, _} = boundary_request(ctx, %{champion_id: ctx.creator.id, reviewer_id: foreign_id})
        assert {400, _} = boundary_request(ctx, %{champion_id: foreign_id, reviewer_id: ctx.creator.id})
      end)
    end

    test "rejects duplicate ids when the person is not an active company member", ctx do
      foreign_id = invalid_owner_id(ctx, :other_company)

      assert_unchanged(ctx, fn ->
        assert {400, _} = boundary_request(ctx, %{champion_id: foreign_id, reviewer_id: foreign_id})
      end)
    end

    test "accepts the same active member as both owners", ctx do
      assert {200, res} = boundary_request(ctx, %{champion_id: ctx.creator.id, reviewer_id: ctx.creator.id})
      assert owner_id(res, :champion) == ctx.creator.id
    end

    test "accepts nil and omitted owners", ctx do
      assert {200, res} = boundary_request(ctx, %{champion_id: nil, reviewer_id: nil})
      assert owner_id(res, :champion) == nil
      assert owner_id(res, :reviewer) == nil

      assert {200, res} = boundary_request(ctx, %{reviewer_id: ctx.creator.id})
      assert owner_id(res, :champion) == nil
      assert owner_id(res, :reviewer) == ctx.creator.id
    end

    test "accepts an active guest and a member without destination access", ctx do
      ctx = Factory.add_company_member(ctx, :guest_member)
      {:ok, guest} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.creator, ctx.guest_member)
      ctx = Factory.add_company_member(ctx, :outsider)

      assert guest.type == :guest
      assert {:error, :not_found} = Operately.Groups.Group.get(guest, id: ctx.space.id)
      assert {:error, :not_found} = Operately.Groups.Group.get(ctx.outsider, id: ctx.space.id)
      assert {:error, :not_found} = Operately.People.Person.get(guest, id: guest.id)

      assert {200, res} = boundary_request(ctx, %{champion_id: guest.id, reviewer_id: ctx.outsider.id})
      assert owner_id(res, :champion) == guest.id
      assert owner_id(res, :reviewer) == ctx.outsider.id
    end

    test "rejects a destination from another company even when a binding exists", ctx do
      other = Factory.setup(%{})
      caller_group = Operately.Access.get_group!(person_id: ctx.creator.id)
      context = Operately.Access.get_context!(group_id: other.company.company_space_id)

      {:ok, _} =
        Operately.Access.create_binding(%{
          group_id: caller_group.id,
          context_id: context.id,
          access_level: Binding.full_access()
        })

      assert_unchanged(ctx, fn ->
        assert {404, _} = boundary_request(ctx, %{space_id: other.company.company_space_id})
      end)
    end

    test "keeps company read-only rejection ahead of owner validation", ctx do
      %{company_id: ctx.company.id, access_state: :read_only}
      |> Operately.Billing.CompanyBillingAccount.changeset()
      |> Repo.insert!()

      foreign_id = invalid_owner_id(ctx, :other_company)

      assert_unchanged(ctx, fn ->
        assert {403, _} = boundary_request(ctx, %{champion_id: foreign_id, reviewer_id: ctx.creator.id})
      end)
    end
  end

  describe "external credentials" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_api_token(:write_token, :creator, read_only: false)
      |> Factory.add_api_token(:read_token, :creator, read_only: true)
    end

    test "write token rejects a foreign owner without creating project records", ctx do
      foreign_id = invalid_owner_id(ctx, :other_company)

      assert_unchanged(ctx, fn ->
        assert {400, _} =
                 external_mutation(external_conn(), ctx.write_token, "projects/create", boundary_inputs(ctx, %{champion_id: foreign_id}))
      end)
    end

    test "read-only token cannot create a project", ctx do
      assert_unchanged(ctx, fn ->
        assert {403, "Read-only API tokens cannot execute mutations"} =
                 external_mutation(external_conn(), ctx.read_token, "projects/create", boundary_inputs(ctx, %{champion_id: ctx.creator.id}))
      end)
    end
  end

  defp boundary_request(ctx, attrs) do
    mutation(ctx.conn, [:projects, :create], boundary_inputs(ctx, attrs))
  end

  defp boundary_inputs(ctx, attrs) do
    Map.merge(
      %{
        space_id: ctx.space.id,
        name: "Bounded project",
        anonymous_access_level: Binding.no_access(),
        company_access_level: Binding.view_access(),
        space_access_level: Binding.edit_access()
      },
      attrs
    )
  end

  defp external_conn do
    Phoenix.ConnTest.build_conn()
    |> Plug.Conn.put_req_header("content-type", "application/json")
  end

  defp invalid_owner_id(_ctx, :other_company), do: Factory.setup(%{}).creator.id
  defp invalid_owner_id(_ctx, :missing), do: Ecto.UUID.generate()

  defp invalid_owner_id(ctx, :same_account) do
    ctx = Factory.add_company(ctx, :other_company, ctx.account)

    Operately.Repo.get_by!(Operately.People.Person, company_id: ctx.other_company.id, account_id: ctx.account.id).id
  end

  defp invalid_owner_id(ctx, suspension_field) do
    ctx = Factory.add_company_member(ctx, :invalid_owner)
    value = if suspension_field == :suspended, do: true, else: DateTime.utc_now() |> DateTime.truncate(:second)
    ctx.invalid_owner |> Ecto.Changeset.change(%{suspension_field => value}) |> Repo.update!()
    ctx.invalid_owner.id
  end

  defp owner_id(res, role) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.project.id)

    Operately.Projects.Project
    |> Repo.get!(id)
    |> Repo.preload(:contributors)
    |> Map.fetch!(:contributors)
    |> Enum.find_value(fn contributor -> contributor.role == role && contributor.person_id end)
  end

  defp assert_unchanged(_ctx, fun) do
    before = resource_snapshot()
    fun.()
    assert resource_snapshot() == before
  end

  defp resource_snapshot do
    [
      Operately.Projects.Project,
      Operately.ResourceHubs.ResourceHub,
      Operately.Projects.Contributor,
      Operately.Access.Binding,
      Operately.Access.GroupMembership,
      Operately.Groups.Member,
      Operately.Notifications.Subscription,
      Operately.Notifications.SubscriptionList,
      Operately.Activities.Activity
    ]
    |> Enum.map(&Repo.aggregate(&1, :count))
  end
end
