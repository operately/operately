defmodule Operately.Support.Factory.Projects do
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Support.Factory.Utils

  def add_project(ctx, testid, space_name, opts \\ []) do
    creator = Keyword.get(opts, :creator, :creator)
    champion = Keyword.get(opts, :champion, nil)
    reviewer = Keyword.get(opts, :reviewer, nil)
    goal = Keyword.get(opts, :goal, nil)

    atts = %{
      name: Keyword.get(opts, :name, Atom.to_string(testid)),
      creator_id: ctx[creator].id,
      company_id: ctx.company.id,
      group_id: ctx[space_name].id,
      company_access_level: Binding.edit_access(),
      space_access_level: Binding.edit_access()
    }

    project =
      atts
      |> maybe_add_key(:champion_id, champion && ctx[champion].id)
      |> maybe_add_key(:reviewer_id, reviewer && ctx[reviewer].id)
      |> maybe_add_key(:goal_id, goal && ctx[goal].id)
      |> Operately.ProjectsFixtures.project_fixture()
      |> set_deadline(opts)
      |> set_started_at(opts)

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

  def add_project_contributor(ctx, testid, project_name, opts \\ [])

  def add_project_contributor(ctx, testid, project_name, :as_person) do
    ctx = add_project_contributor(ctx, testid, project_name)
    person = Repo.preload(ctx[testid], :person).person

    Map.put(ctx, testid, person)
  end

  def add_project_contributor(ctx, testid, project_name, opts) do
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

  def add_project_check_in(ctx, testid, project_name, author_name) do
    project = Map.fetch!(ctx, project_name)
    author = Map.fetch!(ctx, author_name)

    check_in = Operately.ProjectsFixtures.check_in_fixture(%{
      project_id: project.id,
      author_id: author.id,
    })

    Map.put(ctx, testid, check_in)
  end

  def add_project_milestone(ctx, testid, project_name, author_name) do
    project = Map.fetch!(ctx, project_name)
    author = Map.fetch!(ctx, author_name)

    milestone = Operately.ProjectsFixtures.milestone_fixture(author, %{
        project_id: project.id,
      })
      |> Repo.preload(:project)

    Map.put(ctx, testid, milestone)
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

  #
  # Helpers
  #

  defp maybe_add_key(map, key, value) do
    if value do
      Map.put(map, key, value)
    else
      map
    end
  end

  defp set_started_at(project, opts) do
    if opts[:started_at] do
      {:ok, project} = Operately.Projects.update_project(project, %{
        started_at: Keyword.get(opts, :started_at)
      })

      project
    else
      project
    end
  end

  defp set_deadline(project, opts) do
    if opts[:deadline] do
      {:ok, project} = Operately.Projects.update_project(project, %{
        deadline: Keyword.get(opts, :deadline)
      })

      project 
    else
      project
    end
  end
end
