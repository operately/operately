defmodule Operately.AccessContextsTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Context

  import Operately.AccessFixtures, only: [context_fixture: 1]
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.CompaniesFixtures

  describe "access_contexts" do
    setup do
      company = create_company_without_context()
      context = context_fixture(%{company_id: company.id})

      {:ok, company: company, context: context}
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
      update_attrs = %{company_id: nil, group_id: another_group.id}

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
    import Operately.GoalsFixtures

    setup do
      company = create_company_without_context()
      group = create_group_without_context(company.id)
      creator = person_fixture_with_account(%{company_id: company.id})

      {:ok, company: company, group: group, creator: creator}
    end

    test "create access_context for a company" do
      company = company_fixture()

      assert Access.get_context!(company_id: company.id)
    end

    test "create access_context for a group", ctx do
      group = group_fixture(ctx.creator)

      assert Access.get_context!(group_id: group.id)
    end

    test "create access_context for a goal", ctx do
      goal = goal_fixture(ctx.creator, %{space_id: ctx.group.id, targets: []})

      assert Access.get_context!(goal_id: goal.id)
    end

    test "create access_context for a project", ctx do
      project = project_fixture(%{company_id: ctx.company.id, group_id: ctx.group.id, creator_id: ctx.creator.id})

      assert Access.get_context!(project_id: project.id)
    end

    test "access_context cannot be attached to more than one entity", ctx do
      project = create_project_without_context(%{company_id: ctx.company.id, group_id: ctx.group.id, creator_id: ctx.creator.id})
      goal = create_goal_without_context(ctx.creator, %{group_id: ctx.group.id})

      # refutes project and group
      attrs = %{project_id: project.id, group_id: ctx.group.id}
      changeset = Context.changeset(%Context{}, attrs)

      refute changeset.valid?
      assert {:error, %Ecto.Changeset{}} = Access.create_context(attrs)

      # refutes company and group
      attrs = %{company_id: ctx.company.id, group_id: ctx.group.id}
      changeset = Context.changeset(%Context{}, attrs)

      refute changeset.valid?
      assert {:error, %Ecto.Changeset{}} = Access.create_context(attrs)

      # refutes goal and group
      attrs = %{goal_id: goal.id, group_id: ctx.group.id}
      changeset = Context.changeset(%Context{}, attrs)

      refute changeset.valid?
      assert {:error, %Ecto.Changeset{}} = Access.create_context(attrs)
    end
  end

  #
  # Helpers
  #

  defp create_company_without_context do
    {:ok, company} = Operately.Companies.Company.changeset(%{
      mission: "some mission",
      name: "some name",
      trusted_email_domains: []
    })
    |> Repo.insert()

    Access.create_group(%{company_id: company.id, tag: :full_access})
    Access.create_group(%{company_id: company.id, tag: :standard})

    company
  end

  defp create_group_without_context(company_id) do
    {:ok, group} = Operately.Groups.Group.changeset(%{
      company_id: company_id,
      name: "some name",
      mission: "some mission",
      icon: "some icon",
      color: "come color",
    })
    |> Repo.insert()

    Access.create_group(%{group_id: group.id, tag: :full_access})
    Access.create_group(%{group_id: group.id, tag: :standard})

    group
  end

  defp create_project_without_context(attrs) do
    {:ok, project} = Operately.Projects.Project.changeset(
      Map.merge(attrs, %{name: "some name"})
    )
    |> Repo.insert()

    project
  end

  defp create_goal_without_context(creator, attrs) do
    {:ok, goal} = Map.merge(%{
      name: "some name",
      company_id: creator.company_id,
      champion_id: creator.id,
      reviewer_id: creator.id,
      creator_id: creator.id,
    }, attrs)
    |> Operately.Goals.Goal.changeset()
    |> Repo.insert()

    goal
  end
end
