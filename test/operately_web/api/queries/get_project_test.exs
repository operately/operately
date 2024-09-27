defmodule OperatelyWeb.Api.Queries.GetProjectTest do
  use OperatelyWeb.TurboCase

  import OperatelyWeb.Api.Serializer
  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_projects, %{})
    end

    test "it is not possible to get a project from another company", ctx do
      ctx = register_and_log_in_account(ctx)
      project = create_project(ctx)

      other_ctx = register_and_log_in_account(ctx)
      other_project = create_project(other_ctx, company_id: other_ctx.company.id, creator_id: other_ctx.person.id)

      assert query(ctx.conn, :get_project, %{id: Paths.project_id(other_project)}) == not_found_response()
      assert {200, _} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, space_id: space.id, creator_id: creator.id})
    end

    test "company members have no access", ctx do
      p = create_project(ctx, company_access_level: Binding.no_access())

      assert {404, %{message: msg} = _res} = query(ctx.conn, :get_project, %{id: Paths.project_id(p)})
      assert msg == "The requested resource was not found"
    end

    test "company members have access", ctx do
      p = create_project(ctx, company_access_level: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(p)})
      assert res.project == serialize(p, level: :full)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      p = create_project(ctx, space_access_level: Binding.no_access())

      assert {404, %{message: msg} = _res} = query(ctx.conn, :get_project, %{id: Paths.project_id(p)})
      assert msg == "The requested resource was not found"
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      p = create_project(ctx, space_access_level: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(p)})
      assert res.project == serialize(p, level: :full)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      p = create_project(ctx, champion_id: champion.id)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_project, %{id: Paths.project_id(p)})
      assert res.project == serialize(p, level: :full)

      # another user's request
      assert {404, %{message: msg} = _res} = query(ctx.conn, :get_project, %{id: Paths.project_id(p)})
      assert msg == "The requested resource was not found"
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      p = create_project(ctx, reviewer_id: reviewer.id)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_project, %{id: Paths.project_id(p)})
      assert res.project == serialize(p, level: :full)

      # another user's request
      assert {404, %{message: msg} = _res} = query(ctx.conn, :get_project, %{id: Paths.project_id(p)})
      assert msg == "The requested resource was not found"
    end
  end

  describe "get_project functionality" do
    setup :register_and_log_in_account

    test "get a project with nothing included", ctx do
      project = create_project(ctx)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
      assert res.project == serialize(project, level: :full)
    end

    test "returns 400 if id is not provided", ctx do
      assert query(ctx.conn, :get_project, %{}) == {400, %{error: "Bad request", message: "id is required"}}
    end

    test "include_space", ctx do
      space = group_fixture(ctx.person, company_id: ctx.company.id)
      project = create_project(ctx, group_id: space.id)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_space: true})
      assert res.project.space == serialize(space, level: :essential)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
      assert res.project.space == nil
    end

    test "include_retrospective", ctx do
      project = create_project(ctx)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_retrospective: true})
      refute res.project.retrospective

      retrospective = retrospective_fixture(%{author_id: ctx.person.id, project_id: project.id})

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_retrospective: true})
      assert res.project.retrospective == serialize(retrospective)
    end

    test "include_contributors", ctx do
      project = create_project(ctx)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_contributors: true})
      assert length(res.project.contributors) == 1
      assert res.project.contributors == serialize(Operately.Projects.list_project_contributors(project), level: :essential)

      dev = person_fixture(company_id: ctx.company.id)
      {:ok, _} = Operately.Projects.create_contributor(dev, %{
        person_id: dev.id,
        responsibility: "some responsibility",
        project_id: project.id,
        permissions: Binding.edit_access()
      })

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_contributors: true})
      assert length(res.project.contributors) == 2
      assert res.project.contributors == serialize(Operately.Projects.list_project_contributors(project), level: :essential)
    end

    test "include_goal", ctx do
      project = create_project(ctx)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_goal: true})
      assert res.project.goal == nil

      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)
      {:ok, project} = Operately.Projects.update_project(project, %{goal_id: goal.id})

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_goal: true})
      assert res.project.goal == serialize(goal, level: :essential)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
      assert res.project.goal == nil
    end

    test "include_champion", ctx do
      project = create_project(ctx)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
      assert res.project.champion == nil

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_champion: true})
      assert res.project.champion == serialize(ctx.person, level: :essential)
    end

    test "include_reviewer", ctx do
      person = create_person(ctx)
      project = create_project(ctx, reviewer_id: person.id)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
      assert res.project.reviewer == nil

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_reviewer: true})
      assert res.project.reviewer == serialize(person, level: :essential)
    end

    test "include_archived", ctx do
      project = create_project(ctx)
      {:ok, project} = Operately.Projects.archive_project(ctx.person, project)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
      assert res.project.is_archived == true
    end

    test "include_permissions", ctx do
      project = create_project(ctx)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
      assert res.project.permissions == nil

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_permissions: true})
      assert res.project.permissions == Map.from_struct(Operately.Projects.Permissions.calculate(project))
    end

    test "include_key_resources", ctx do
      project = create_project(ctx)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
      assert res.project.key_resources == nil

      key_resource = key_resource_fixture(project_id: project.id)
      key_resource = Operately.Repo.preload(key_resource, :project)
      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_key_resources: true})
      assert res.project.key_resources == [serialize(key_resource, level: :essential)]
    end

    test "include_access_levels", ctx do
      space = group_fixture(ctx.person)
      project = create_project(ctx, %{
        group_id: space.id,
        anonymous_access_level: Binding.view_access(),
        company_access_level: Binding.edit_access(),
        space_access_level: Binding.full_access(),
      })

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})
      refute res.project.access_levels

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project), include_access_levels: true})

      assert res.project.access_levels.public == Binding.view_access()
      assert res.project.access_levels.company == Binding.edit_access()
      assert res.project.access_levels.space == Binding.full_access()
    end

    test "include_contributors_access_levels", ctx do
      project = create_project(ctx)

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(project)})

      refute Map.has_key?(res.project, :contributor)

      assert {200, res} = query(ctx.conn, :get_project, %{
        id: Paths.project_id(project),
        include_contributors: true,
        include_contributors_access_levels: true
      })

      assert length(res.project.contributors) > 0

      Enum.each(res.project.contributors, fn contributor ->
        assert Map.has_key?(contributor, :access_level)
      end)
    end

    test "include_potential_subscribers", ctx do
      ctx = Factory.add_company_member(ctx, :creator)
        |> Factory.add_space(:space)
        |> Factory.add_project(:project, :space)
        |> Factory.add_project_contributor(:champion, :project, role: :champion)
        |> Factory.add_project_contributor(:reviewer, :project, role: :reviewer)
        |> Factory.add_project_contributor(:contrib1, :project)
        |> Factory.add_project_contributor(:contrib2, :project)
        |> Factory.add_project_contributor(:contrib3, :project)


      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(ctx.project)})

      refute res.project.potential_subscribers

      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(ctx.project), include_potential_subscribers: true})

      [ctx.reviewer, ctx.champion]
      |> Enum.each(fn contrib ->
        candidate = Enum.find(res.project.potential_subscribers, &(equal_ids?(&1.person.id, contrib.person_id)))
        assert candidate.priority
      end)

      [ctx.contrib1, ctx.contrib2, ctx.contrib3]
      |> Enum.each(fn contrib ->
        candidate = Enum.find(res.project.potential_subscribers, &(equal_ids?(&1.person.id, contrib.person_id)))
        refute candidate.priority
      end)
    end

    test "include_milestones", ctx do
      ctx = Factory.add_company_member(ctx, :creator)
        |> Factory.add_space(:space)
        |> Factory.add_project(:project, :space)
        |> Factory.add_project_milestone(:milestone1, :project, :creator)
        |> Factory.add_project_milestone(:milestone2, :project, :creator)

      # doesn't include milestone
      assert {200, res} = query(ctx.conn, :get_project, %{id: Paths.project_id(ctx.project)})

      refute res.project.milestones

      # include milestones
      assert {200, res} = query(ctx.conn, :get_project, %{
        id: Paths.project_id(ctx.project),
        include_milestones: true,
      })

      assert length(res.project.milestones) == 2
      assert Enum.find(res.project.milestones, &(&1 == Serializer.serialize(ctx.milestone1)))
      assert Enum.find(res.project.milestones, &(&1 == Serializer.serialize(ctx.milestone2)))

      # doesn't include archived milestones
      {:ok, _} = Repo.soft_delete(ctx.milestone1)

      assert {200, res} = query(ctx.conn, :get_project, %{
        id: Paths.project_id(ctx.project),
        include_milestones: true,
      })

      assert length(res.project.milestones) == 1
      assert Enum.find(res.project.milestones, &(&1 == Serializer.serialize(ctx.milestone2)))
    end
  end

  #
  # Helpers
  #

  def create_project(ctx, attrs \\ %{}) do
    attrs = Map.merge(%{
      company_id: ctx.company.id,
      name: "Project 1",
      creator_id: ctx[:creator_id] || ctx.person.id,
      reviewer_id: attrs[:reviewer_id],
      group_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }, Enum.into(attrs, %{}))

    project_fixture(attrs)
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end

  defp create_person(ctx) do
    person_fixture(company_id: ctx.company.id)
  end

  def equal_ids?(short_id, id) do
    {:ok, decoded_id} = OperatelyWeb.Api.Helpers.decode_id(short_id)

    decoded_id == id
  end
end
