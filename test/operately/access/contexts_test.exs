defmodule Operately.AccessContextsTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Context

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.CompaniesFixtures

  describe "access_contexts" do
    setup do
      company = company_fixture()
      creator = person_fixture_with_account(%{company_id: company.id})

      group = group_fixture(creator)
      context = Repo.preload(group, :access_context).access_context

      {:ok, company: company, group: group, creator: creator, context: context}
    end

    test "list_contexts/0 returns all contexts", ctx do
      assert Access.list_contexts() == [ctx.context]
    end

    test "get_context!/1 returns the context with given id", ctx do
      assert Access.get_context!(ctx.context.id) == ctx.context
    end

    test "create_context/1 with valid data creates a context", ctx do
      another_group = create_group_without_context(ctx.company.id)
      valid_attrs = %{group_id: another_group.id}

      assert {:ok, %Context{} = _context} = Access.create_context(valid_attrs)
    end

    test "update_context/2 with valid data updates the context", ctx do
      another_group = create_group_without_context(ctx.company.id)
      update_attrs = %{group_id: another_group.id}

      assert {:ok, %Context{} = _context} = Access.update_context(ctx.context, update_attrs)
    end

    test "delete_context/1 deletes the context", ctx do
      assert {:ok, %Context{}} = Access.delete_context(ctx.context)
      assert_raise Ecto.NoResultsError, fn -> Access.get_context!(ctx.context.id) end
    end

    test "change_context/1 returns a context changeset", ctx do
      assert %Ecto.Changeset{} = Access.change_context(ctx.context)
    end
  end

  describe "access_contexts relationships with projects, groups, activities and companies" do
    import Operately.ActivitiesFixtures
    import Operately.GoalsFixtures

    setup do
      company = company_fixture()
      creator = person_fixture_with_account(%{company_id: company.id})
      group = group_fixture(creator)
      goal = goal_fixture(creator, %{space_id: group.id, targets: []})
      project = project_fixture(%{company_id: company.id, group_id: group.id, creator_id: creator.id})
      activity = activity_fixture(%{author_id: creator.id})

      {:ok, company: company, group: group, goal: goal, project: project, activity: activity, creator: creator}
    end

    test "create access_context for a company", ctx do
      attrs = %{company_id: ctx.company.id}

      assert {:ok, %Context{} = _context} = Access.create_context(attrs)
    end

    test "create access_context for a group", ctx do
      group = group_fixture(ctx.creator)

      assert nil != Access.get_context!(group_id: group.id)
    end

    test "create access_context for a goal", ctx do
      attrs = %{goal_id: ctx.goal.id}

      assert {:ok, %Context{} = _context} = Access.create_context(attrs)
    end

    test "create access_context for a project", ctx do
      project = project_fixture(%{company_id: ctx.company.id, group_id: ctx.group.id, creator_id: ctx.creator.id})

      assert nil != Access.get_context_by_project!(project.id)
    end

    test "access_context cannot be attached to more than one entity", ctx do
      # refutes project and group
      attrs = %{project_id: ctx.project.id, group_id: ctx.group.id}
      changeset = Context.changeset(%Context{}, attrs)

      refute changeset.valid?
      assert {:error, %Ecto.Changeset{}} = Access.create_context(attrs)

      # refutes company and group
      attrs = %{company_id: ctx.company.id, group_id: ctx.group.id}
      changeset = Context.changeset(%Context{}, attrs)

      refute changeset.valid?
      assert {:error, %Ecto.Changeset{}} = Access.create_context(attrs)

      # refutes goal and group
      attrs = %{goal_id: ctx.goal.id, group_id: ctx.group.id}
      changeset = Context.changeset(%Context{}, attrs)

      refute changeset.valid?
      assert {:error, %Ecto.Changeset{}} = Access.create_context(attrs)
    end
  end

  #
  # Helpers
  #

  def create_group_without_context(company_id) do
    {:ok, group} = Operately.Groups.Group.changeset(%{
      company_id: company_id,
      name: "some name",
      mission: "some mission",
      icon: "some icon",
      color: "come color",
    })
    |> Repo.insert()
    group
  end
end
