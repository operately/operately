defmodule OperatelyWeb.Api.Queries.ListSpaceToolsTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures
  import Operately.MessagesFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :list_space_tools, %{})
    end
  end


  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    @space_table [
      %{company: :no_access,      space: :no_access,      expected: :forbidden},

      %{company: :no_access,      space: :view_access,    expected: :allowed},
      %{company: :no_access,      space: :comment_access, expected: :allowed},
      %{company: :no_access,      space: :edit_access,    expected: :allowed},
      %{company: :no_access,      space: :full_access,    expected: :allowed},

      %{company: :view_access,    space: :no_access,      expected: :allowed},
      %{company: :comment_access, space: :no_access,      expected: :allowed},
      %{company: :edit_access,    space: :no_access,      expected: :allowed},
      %{company: :full_access,    space: :no_access,      expected: :allowed},
    ]

    @project_table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: :forbidden},

      %{company: :no_access,      space: :no_access,      project: :view_access,    expected: :allowed},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: :allowed},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: :allowed},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: :allowed},

      %{company: :no_access,      space: :view_access,    project: :no_access,      expected: :allowed},
      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: :allowed},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: :allowed},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: :allowed},

      %{company: :view_access,    space: :no_access,      project: :no_access,      expected: :allowed},
      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: :allowed},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: :allowed},
      %{company: :full_access,    space: :no_access,      project: :no_access,      expected: :allowed},
    ]

    tabletest @space_table do
      test "Resource Hubs - if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        create_resource_hub(ctx, space, @test.company, @test.space)
        create_resource_hub(ctx, space, @test.company, @test.space)

        assert {200, res} = query(ctx.conn, :list_space_tools, %{space_id: Paths.space_id(space)})

        case @test.expected do
          :forbidden ->
            assert length(res.tools.resource_hubs) == 0
          :allowed ->
            assert length(res.tools.resource_hubs) == 2
        end
      end
    end

    tabletest @space_table do
      test "Messages Boards - if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company)
        add_member(ctx, space, ctx.person, @test.space)
        messages_board_fixture(space.id)
        messages_board_fixture(space.id)

        assert {200, res} = query(ctx.conn, :list_space_tools, %{space_id: Paths.space_id(space)})

        case @test.expected do
          :forbidden ->
            assert length(res.tools.messages_boards) == 0
          :allowed ->
            assert length(res.tools.messages_boards) == 3 # 2 munually created + 1 created with space
        end
      end
    end

    tabletest @project_table do
      test "Projects - if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        create_project(ctx, space, @test.company, @test.space, @test.project)
        create_project(ctx, space, @test.company, @test.space, @test.project)

        assert {200, res} = query(ctx.conn, :list_space_tools, %{space_id: Paths.space_id(space)})

        case @test.expected do
          :forbidden ->
            assert length(res.tools.projects) == 0
          :allowed ->
            assert length(res.tools.projects) == 2
        end
      end
    end

    tabletest @space_table do
      test "Goals - if caller has levels company=#{@test.company}, space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        create_goal(ctx, space, @test.company, @test.space)
        create_goal(ctx, space, @test.company, @test.space)

        assert {200, res} = query(ctx.conn, :list_space_tools, %{space_id: Paths.space_id(space)})

        case @test.expected do
          :forbidden ->
            assert length(res.tools.goals) == 0
          :allowed ->
            assert length(res.tools.goals) == 2
        end
      end
    end
  end

  describe "list_space_tools functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project1, :space)
      |> Factory.add_project(:project2, :space)
      |> Factory.add_goal(:goal1, :space)
      |> Factory.add_goal(:goal2, :space)
      |> Factory.add_messages_board(:board1, :space)
      |> Factory.add_messages_board(:board2, :space)
      |> Factory.add_message(:message1, :board1)
      |> Factory.add_message(:message2, :board1)
      |> Factory.add_message(:message3, :board2)
      |> Factory.preload(:message1, :space)
      |> Factory.add_comment(:comment1, :message1)
      |> Factory.add_comment(:comment2, :message1)
      |> Factory.add_resource_hub(:hub1, :space, :creator)
      |> Factory.add_resource_hub(:hub2, :space, :creator)
      |> Factory.add_folder(:folder1, :hub1)
      |> Factory.add_folder(:folder2, :hub1)
      |> Factory.add_folder(:folder3, :hub2)
    end

    test "list projects", ctx do
      assert {200, res} = query(ctx.conn, :list_space_tools, %{space_id: Paths.space_id(ctx.space)})

      assert length(res.tools.projects) == 2
      assert Enum.find(res.tools.projects, &(&1 == Serializer.serialize(ctx.project1)))
      assert Enum.find(res.tools.projects, &(&1 == Serializer.serialize(ctx.project2)))
    end

    test "list goals", ctx do
      assert {200, res} = query(ctx.conn, :list_space_tools, %{space_id: Paths.space_id(ctx.space)})

      assert length(res.tools.goals) == 2
      assert Enum.find(res.tools.goals, &(&1 == Serializer.serialize(ctx.goal1)))
      assert Enum.find(res.tools.goals, &(&1 == Serializer.serialize(ctx.goal2)))
    end

    test "list messages boards", ctx do
      assert {200, res} = query(ctx.conn, :list_space_tools, %{space_id: Paths.space_id(ctx.space)})

      assert length(res.tools.messages_boards) == 3 # 2 munually created + 1 created with space

      board1 = Enum.find(res.tools.messages_boards, &(&1.id == Paths.messages_board_id(ctx.board1)))
      assert length(board1.messages) == 2

      board2 = Enum.find(res.tools.messages_boards, &(&1.id == Paths.messages_board_id(ctx.board2)))
      assert length(board2.messages) == 1

      message = hd(board1.messages)
      assert message.author == Serializer.serialize(ctx.creator)
    end

    test "list resource hubs", ctx do
      assert {200, res} = query(ctx.conn, :list_space_tools, %{space_id: Paths.space_id(ctx.space)})

      assert length(res.tools.resource_hubs) == 2

      hub1 = Enum.find(res.tools.resource_hubs, &(&1.id == Paths.resource_hub_id(ctx.hub1)))
      assert length(hub1.nodes) == 2

      hub2 = Enum.find(res.tools.resource_hubs, &(&1.id == Paths.resource_hub_id(ctx.hub2)))
      assert length(hub2.nodes) == 1
    end
  end

  #
  # Helpers
  #

  def create_space(ctx, company_permissions \\ :no_access) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.from_atom(company_permissions)})
  end

  defp add_member(ctx, space, person, access_level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{id: person.id, access_level: Binding.from_atom(access_level)}])
  end

  def create_resource_hub(ctx, space, company_members_level, space_members_level) do
    resource_hub = resource_hub_fixture(ctx.creator, space, %{
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    resource_hub
  end

  def create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    if project_member_level != :no_access do
      {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
        project_id: project.id,
        person_id: ctx.person.id,
        permissions: Binding.from_atom(project_member_level),
        responsibility: "some responsibility"
      })
    end

    project
  end

  def create_goal(ctx, space, company_members_level, space_members_level) do
    goal = goal_fixture(ctx.creator, %{
      space_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    goal
  end
end
