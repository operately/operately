defmodule OperatelyWeb.Api.Projects.AcknowledgeRetrospectiveTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :acknowledge_retrospective], %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access, space: :no_access, project: :no_access, expected: 404},
      %{company: :no_access, space: :no_access, project: :comment_access, expected: 403},
      %{company: :no_access, space: :no_access, project: :edit_access, expected: 200},
      %{company: :no_access, space: :no_access, project: :full_access, expected: 200},
      %{company: :no_access, space: :comment_access, project: :no_access, expected: 403},
      %{company: :no_access, space: :edit_access, project: :no_access, expected: 200},
      %{company: :no_access, space: :full_access, project: :no_access, expected: 200},
      %{company: :comment_access, space: :no_access, project: :no_access, expected: 403},
      %{company: :edit_access, space: :no_access, project: :no_access, expected: 200},
      %{company: :full_access, space: :no_access, project: :no_access, expected: 200}
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
        retrospective = retrospective_fixture(%{author_id: ctx.creator.id, project_id: project.id})

        assert {code, res} = request(ctx.conn, project)
        assert code == @test.expected

        case @test.expected do
          200 -> assert_response(res, retrospective)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    test "authors cannot acknowledge their own retrospectives", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :no_access, :edit_access)
      retrospective_fixture(%{author_id: ctx.person.id, project_id: project.id})

      assert {400, res} = request(ctx.conn, project)
      assert res.message == "Authors cannot acknowledge their own retrospectives"
    end
  end

  describe "acknowledge_retrospective functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
    end

    test "acknowledges retrospective", ctx do
      retrospective = retrospective_fixture(%{author_id: ctx.creator.id, project_id: ctx.project.id})

      refute retrospective.acknowledged_at
      refute retrospective.acknowledged_by_id

      assert {200, res} = request(ctx.conn, ctx.project)
      assert_response(res, retrospective)
    end

    test "returns not found when the project has no retrospective", ctx do
      assert {404, _} = request(ctx.conn, ctx.project)
    end

    test "returns not found for an unknown project", ctx do
      unknown_project_id = Operately.ShortUuid.encode!(Ecto.UUID.generate())

      assert {404, _} = request_by_project_id(ctx.conn, unknown_project_id)
    end

    test "idempotency: acknowledging the same retrospective multiple times does not change the state", ctx do
      retrospective = retrospective_fixture(%{author_id: ctx.creator.id, project_id: ctx.project.id})

      assert {200, res} = request(ctx.conn, ctx.project)
      assert_response(res, retrospective)
      assert acknowledge_activity_count() == 1

      assert {200, res} = request(ctx.conn, ctx.project)
      assert_response(res, retrospective)
      assert acknowledge_activity_count() == 1
    end
  end

  defp request(conn, project) do
    request_by_project_id(conn, Paths.project_id(project))
  end

  defp request_by_project_id(conn, project_id), do: mutation(conn, [:projects, :acknowledge_retrospective], %{project_id: project_id})

  defp assert_response(res, retrospective) do
    retrospective = Repo.reload(retrospective) |> Repo.preload([:project, :author, :acknowledged_by])

    assert retrospective.acknowledged_at
    assert retrospective.acknowledged_by_id
    assert res.retrospective.id == Paths.project_retrospective_id(retrospective)
  end

  defp acknowledge_activity_count do
    import Ecto.Query, only: [from: 2]
    query = from(a in Operately.Activities.Activity, where: a.action == "project_retrospective_acknowledged")

    Operately.Repo.aggregate(query, :count)
  end

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project =
      project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        group_id: space.id,
        company_access_level: Binding.from_atom(company_members_level),
        space_access_level: Binding.from_atom(space_members_level)
      })

    if company_members_level != :no_access do
      context = Operately.Access.get_context(company_id: ctx.company.id)
      Operately.Access.bind(context, person_id: ctx.person.id, level: Binding.from_atom(company_members_level))
    end

    if space_members_level != :no_access do
      {:ok, _} =
        Operately.Groups.add_members(ctx.creator, space.id, [
          %{
            id: ctx.person.id,
            access_level: Binding.from_atom(space_members_level)
          }
        ])
    end

    if project_member_level != :no_access do
      {:ok, _} =
        Operately.Projects.create_contributor(ctx.creator, %{
          project_id: project.id,
          person_id: ctx.person.id,
          permissions: Binding.from_atom(project_member_level),
          responsibility: "some responsibility"
        })
    end

    project
  end
end
