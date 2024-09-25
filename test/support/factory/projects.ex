defmodule Operately.Support.Factory.Projects do
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Support.Factory.Utils

  def add_project(ctx, testid, space_name) do
    project = Operately.ProjectsFixtures.project_fixture(%{
      name: Atom.to_string(testid),
      creator_id: ctx.creator.id,
      company_id: ctx.company.id,
      group_id: ctx[space_name].id,
      company_access_level: Binding.edit_access(),
      space_access_level: Binding.edit_access()
    })

    Map.put(ctx, testid, project)
  end

  def add_project_reviewer(ctx, testid, project_name, opts \\ []) do
    project = Map.fetch!(ctx, project_name)

    name = Keyword.get(opts, :name, Utils.testid_to_name(testid))
    role = Keyword.get(opts, :role, :reviewer)
    level = Keyword.get(opts, :permissions, :full_access)
    responsibility = Keyword.get(opts, :responsibility, "Project Manager & Developer")

    person  = Operately.PeopleFixtures.person_fixture_with_account(%{
      company_id: ctx.company.id,
      full_name: name
    })

    reviewer = Operately.ProjectsFixtures.contributor_fixture(ctx.creator, %{
      project_id: project.id,
      person_id: person.id,
      permissions: Binding.from_atom(level),
      responsibility: responsibility,
      role: role
    })

    Map.put(ctx, testid, reviewer)
  end

  def add_project_contributor(ctx, testid, project_name, opts \\ []) do
    project = Map.fetch!(ctx, project_name)

    name = Keyword.get(opts, :name, Utils.testid_to_name(testid))
    role = Keyword.get(opts, :role, :contributor)
    level = Keyword.get(opts, :permissions, :edit_access)
    responsibility = Keyword.get(opts, :responsibility, "Project Manager & Developer")

    person  = Operately.PeopleFixtures.person_fixture_with_account(%{
      company_id: ctx.company.id,
      full_name: name
    })

    contributor = Operately.ProjectsFixtures.contributor_fixture(ctx.creator, %{
      project_id: project.id,
      person_id: person.id,
      permissions: Binding.from_atom(level),
      responsibility: responsibility,
      role: role
    })

    Map.put(ctx, testid, contributor)
  end

  def add_project_retrospective(ctx, testid, project_name, author_name) do
    project = Map.fetch!(ctx, project_name)
    author = Map.fetch!(ctx, author_name)

    retrospective = Operately.ProjectsFixtures.retrospective_fixture(%{
      project_id: project.id,
      author_id: author.id,
    })

    Map.put(ctx, testid, retrospective)
  end

  def edit_project_company_members_access(ctx, project_name, access_level) do
    project = Map.fetch!(ctx, project_name)

    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(company_id: project.company_id, tag: :standard)
    binding = Operately.Access.get_binding(group_id: group.id, context_id: context.id)

    {:ok, _} = Operately.Access.update_binding(binding, %{access_level: Binding.from_atom(access_level)})

    ctx
  end

  def edit_project_space_members_access(ctx, project_name, access_level) do
    project = Map.fetch!(ctx, project_name)

    context= Access.get_context!(project_id: project.id)
    group = Access.get_group!(group_id: project.group_id, tag: :standard)
    binding = Operately.Access.get_binding(group_id: group.id, context_id: context.id)

    {:ok, _} = Operately.Access.update_binding(binding, %{access_level: Binding.from_atom(access_level)})

    ctx
  end
end
