defmodule OperatelyWeb.Api.Mutations.AcknowledgeProjectCheckInTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :acknowledge_project_check_in, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        check_in = check_in_fixture(%{author_id: ctx.creator.id, project_id: project.id})

        assert {code, res} = request(ctx.conn, check_in)
        assert code == @test.expected

        case @test.expected do
          200 -> assert_response(res, check_in)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    test "authors cannot acknowledge their own check-ins", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :no_access, :edit_access)
      check_in = check_in_fixture(%{author_id: ctx.person.id, project_id: project.id})

      assert {400, res} = request(ctx.conn, check_in)
      assert res.message == "Authors cannot acknowledge their own check-ins"
    end
  end

  describe "acknowledge_project_check_in functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
    end

    test "acknowledges check-in", ctx do
      check_in = check_in_fixture(%{author_id: ctx.creator.id, project_id: ctx.project.id})

      refute check_in.acknowledged_at
      refute check_in.acknowledged_by_id

      assert {200, res} = request(ctx.conn, check_in)
      assert_response(res, check_in)
    end

    test "idempontency: acknowledging the same check-in multiple times does not change the state", ctx do
      check_in = check_in_fixture(%{author_id: ctx.creator.id, project_id: ctx.project.id})

      assert {200, res} = request(ctx.conn, check_in)
      assert_response(res, check_in)
      assert acknowledge_activity_count() == 1

      # no new activity created
      assert {200, res} = request(ctx.conn, check_in)
      assert_response(res, check_in)
      assert acknowledge_activity_count() == 1
    end
  end

  #
  # Steps
  #

  defp request(conn, check_in) do
    mutation(conn, :acknowledge_project_check_in, %{id: Paths.project_check_in_id(check_in)})
  end

  defp assert_response(res, check_in) do
    check_in = Repo.reload(check_in) |> Repo.preload(project: [:champion, :reviewer])

    assert check_in.acknowledged_at
    assert check_in.acknowledged_by_id
    expected = Serializer.serialize(check_in, level: :essential) |> normalize_serialized_check_in()
    assert res.check_in == expected
  end

  #
  # Helpers
  #

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if company_members_level != :no_access do
      context = Operately.Access.get_context(company_id: ctx.company.id)
      Operately.Access.bind(context, person_id: ctx.person.id, level: Binding.from_atom(company_members_level))
    end

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

  defp acknowledge_activity_count do
    import Ecto.Query, only: [from: 2]
    query = from(a in Operately.Activities.Activity, where: a.action == "project_check_in_acknowledged")

    Operately.Repo.aggregate(query, :count)
  end

  defp normalize_serialized_check_in(check_in) when is_map(check_in) do
    Map.update(check_in, :project, nil, fn project ->
      Map.update(project, :tasks_kanban_state, %{}, &normalize_tasks_kanban_state/1)
    end)
  end

  defp normalize_tasks_kanban_state(state) when is_map(state) do
    Enum.into(state, %{}, fn {key, ids} ->
      {normalize_tasks_kanban_state_key(key), ids}
    end)
  end

  defp normalize_tasks_kanban_state_key(key) when is_atom(key), do: key
  defp normalize_tasks_kanban_state_key(key) when is_binary(key), do: String.to_atom(key)
end
