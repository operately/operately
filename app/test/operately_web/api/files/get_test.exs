defmodule OperatelyWeb.Api.Files.GetTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.Access.Binding
  alias Operately.Notifications.SubscriptionList

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:files, :get], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
      |> Factory.add_space(:space)
    end

    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},

      %{company: :no_access,      space: :view_access,    expected: 200},
      %{company: :no_access,      space: :comment_access, expected: 200},
      %{company: :no_access,      space: :edit_access,    expected: 200},
      %{company: :no_access,      space: :full_access,    expected: 200},

      %{company: :view_access,    space: :no_access,      expected: 200},
      %{company: :comment_access, space: :no_access,      expected: 200},
      %{company: :edit_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      expected: 200},
    ]

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        resource_hub = resource_hub_fixture(ctx.creator, space)
        file = file_fixture(resource_hub, ctx.creator)

        assert {code, res} = query(ctx.conn, [:files, :get], %{id: Paths.file_id(file)})

        assert code == @test.expected

        case @test.expected do
          404 ->
            assert res.message == "The requested resource was not found"
          200 ->
            assert res.file.id == Paths.file_id(file)
        end
      end
    end
  end

  describe "get_resource_hub_file functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_resource_hub(:project_hub, :project, :creator)
      |> Factory.add_resource_hub(:goal_hub, :goal, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_file(:my_file, :hub, folder: :folder)
      |> Factory.add_file(:project_file, :project_hub)
      |> Factory.add_file(:goal_file, :goal_hub)
    end

    test "get file", ctx do
      assert {200, res} = query(ctx.conn, [:files, :get], %{id: Paths.file_id(ctx.my_file)})

      file = Repo.preload(ctx.my_file, [:node, :blob])

      assert res.file == Serializer.serialize(file, level: :full)
    end

    test "include_author", ctx do
      assert {200, res} = query(ctx.conn, [:files, :get], %{id: Paths.file_id(ctx.my_file)})

      refute res.file.author

      assert {200, res} = query(ctx.conn, [:files, :get], %{
        id: Paths.file_id(ctx.my_file),
        include_author: true
      })

      assert res.file.author == Serializer.serialize(ctx.creator)
    end

    test "include_resource_hub", ctx do
      assert {200, res} = query(ctx.conn, [:files, :get], %{id: Paths.file_id(ctx.my_file)})

      refute res.file.resource_hub

      assert {200, res} = query(ctx.conn, [:files, :get], %{
        id: Paths.file_id(ctx.my_file),
        include_resource_hub: true
      })

      assert res.file.resource_hub == Serializer.serialize(ctx.hub)
    end

    test "include_space", ctx do
      assert {200, res} = query(ctx.conn, [:files, :get], %{id: Paths.file_id(ctx.my_file)})

      refute res.file.space

      assert {200, res} = query(ctx.conn, [:files, :get], %{
        id: Paths.file_id(ctx.my_file),
        include_space: true
      })

      assert res.file.space == Serializer.serialize(ctx.space, level: :essential)
    end

    test "include_subscriptions_list", ctx do
      assert {200, res} = query(ctx.conn, [:files, :get], %{id: Paths.file_id(ctx.my_file)})

      refute res.file.subscription_list

      assert {200, res} = query(ctx.conn, [:files, :get], %{
        id: Paths.file_id(ctx.my_file),
        include_subscriptions_list: true
      })

      {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.my_file.id)

      assert res.file.subscription_list.id == Paths.subscription_list_id(list)
    end

    test "include_potential_subscribers", ctx do
      assert {200, res} = query(ctx.conn, [:files, :get], %{id: Paths.file_id(ctx.my_file)})

      refute res.file.potential_subscribers

      assert {200, res} = query(ctx.conn, [:files, :get], %{
        id: Paths.file_id(ctx.my_file),
        include_potential_subscribers: true,
      })

      assert length(res.file.potential_subscribers) == 1
      assert hd(res.file.potential_subscribers).person == Serializer.serialize(ctx.creator)
    end

    test "include_potential_subscribers preserves included space", ctx do
      assert {200, res} = query(ctx.conn, [:files, :get], %{
        id: Paths.file_id(ctx.my_file),
        include_resource_hub: true,
        include_space: true,
        include_potential_subscribers: true,
      })

      assert res.file.resource_hub.id == Paths.resource_hub_id(ctx.hub)
      assert res.file.space == Serializer.serialize(ctx.space, level: :essential)
      assert length(res.file.potential_subscribers) == 1
    end

    test "include_potential_subscribers preserves parent_folder", ctx do
      assert {200, res} = query(ctx.conn, [:files, :get], %{
        id: Paths.file_id(ctx.my_file),
        include_parent_folder: true,
        include_potential_subscribers: true,
      })

      assert res.file.parent_folder == Repo.preload(ctx.folder, :node) |> Serializer.serialize()
      assert length(res.file.potential_subscribers) == 1
    end

    test "include_project returns the project-backed hub parent", ctx do
      assert {200, res} =
               query(ctx.conn, [:files, :get], %{
                 id: Paths.file_id(ctx.project_file),
                 include_project: true
               })

      refute res.file.resource_hub
      assert res.file.project == Serializer.serialize(ctx.project, level: :essential)
    end

    test "include_resource_hub and include_project keep the project-backed hub data", ctx do
      assert {200, res} =
               query(ctx.conn, [:files, :get], %{
                 id: Paths.file_id(ctx.project_file),
                 include_resource_hub: true,
                 include_project: true
               })

      assert res.file.resource_hub.id == Paths.resource_hub_id(ctx.project_hub)
      assert res.file.project == Serializer.serialize(ctx.project, level: :essential)
    end

    test "include_goal returns the goal-backed hub data", ctx do
      assert {200, res} =
               query(ctx.conn, [:files, :get], %{
                 id: Paths.file_id(ctx.goal_file),
                 include_goal: true
               })

      assert res.file.resource_hub.id == Paths.resource_hub_id(ctx.goal_hub)
      assert res.file.resource_hub.goal == Serializer.serialize(ctx.goal, level: :essential)
    end
  end

  #
  # Helpers
  #

  defp create_space(ctx, company_members_level, space_members_level) do
    space = group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.from_atom(company_members_level)})

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    space
  end
end
