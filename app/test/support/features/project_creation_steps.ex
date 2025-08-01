defmodule Operately.Support.Features.ProjectCreationSteps do
  use Operately.FeatureCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.People.Person
  alias Operately.Projects.Project
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.ContextualDates.ContextualDate

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  step :setup, ctx do
    company = company_fixture(%{name: "Test Org"})

    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    non_contributor = person_fixture_with_account(%{company_id: company.id, full_name: "Non Contributor"})
    project_manager = person_fixture_with_account(%{company_id: company.id, full_name: "Project Manager"})

    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})
    Operately.Groups.add_members(non_contributor, group.id, [
      %{id: non_contributor.id, access_level: Binding.full_access()},
      %{id: project_manager.id, access_level: Binding.full_access()},
      %{id: reviewer.id, access_level: Binding.edit_access()},
    ])

    {:ok, goal} = Operately.Goals.create_goal(champion, %{
      company_id: company.id,
      space_id: group.id,
      name: "Test Goal",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      timeframe: %{
        contextual_start_date: ContextualDate.create_year_date(~D[2021-01-01]),
        contextual_end_date: ContextualDate.create_year_date(~D[2021-12-31])
      },
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
      anonymous_access_level: Binding.view_access(),
    })

    ctx = Map.merge(ctx, %{
      company: company,
      champion: champion,
      reviewer: reviewer,
      group: group,
      non_contributor: non_contributor,
      project_manager: project_manager,
      goal: goal
    })

    UI.login_based_on_tag(ctx)
  end

  step :start_adding_project, ctx do
    ctx
    |> UI.click(testid: "new-dropdown")
    |> UI.click(testid: "new-dropdown-new-project")
  end

  step :start_adding_project_from_lobby, ctx do
    ctx
    |> UI.visit(Paths.home_path(ctx.company))
    |> UI.click(testid: "new-dropdown")
    |> UI.click(testid: "new-dropdown-new-project")
  end

  step :submit_project_form, ctx, fields do
    ctx
    |> UI.fill(testid: "name", with: fields.name)
    |> UI.select_person_in(id: "champion", name: fields.champion.full_name)
    |> run_if(fields[:space], fn ctx ->
      ctx
      |> UI.click(testid: "space")
      |> UI.click_text(fields.space.name)
    end)
    |> run_if(fields[:reviewer], fn ctx ->
      ctx
      |> UI.select_person_in(testid: "reviewer", name: fields.reviewer.full_name)
    end)
    |> run_if(fields[:goal], fn ctx ->
      ctx
      |> UI.click(testid: "goal-selector")
      |> UI.click(testid: UI.testid(["goal", fields.goal.name]))
    end)
    |> run_if(fields[:add_creator_as_contributor], fn ctx ->
      ctx
      |> UI.click(testid: "isContrib-yes")
      |> UI.fill(testid: "creatorrole", with: "Responsible for managing the project")
    end)
    |> UI.click(testid: "submit")
  end

  step :select_space, ctx, space_name do
    ctx
    |> UI.click(testid: "space")
    |> UI.click_text(space_name)
  end

  step :assert_project_created, ctx, fields do
    ctx
    |> UI.assert_text(fields.name)
    |> UI.assert_has(testid: "project-page")

    project = Operately.Repo.get_by!(Operately.Projects.Project, name: fields.name)
    project = Operately.Repo.preload(project, [contributors: :person])

    champion = Enum.find(project.contributors, fn c -> c.role == :champion end)
    reviewer = Enum.find(project.contributors, fn c -> c.role == :reviewer end)

    assert project.company_id == ctx.company.id
    assert project.group_id == ctx.group.id
    assert project.creator_id == fields.creator.id

    assert champion.person.full_name == fields.champion.full_name

    if fields[:reviewer] do
      assert reviewer.person.full_name == fields.reviewer.full_name
    end

    ctx
  end

  step :assert_project_created_email_sent, ctx, fields do
    people = who_should_be_notified(fields)

    Enum.reduce(people, ctx, fn {person, _role}, ctx ->
      ctx
      |> EmailSteps.assert_activity_email_sent(%{
        where: ctx.group.name,
        to: person,
        author: fields.creator,
        action: "added the #{fields.name} project"
      })
    end)
  end

  step :assert_project_created_notification_sent, ctx, fields do
    people = who_should_be_notified(fields)

    Enum.reduce(people, ctx, fn {person, _role}, ctx ->
      ctx
      |> UI.login_as(person)
      |> NotificationsSteps.assert_notification_exists(
        author: fields.creator,
        subject: "#{Person.first_name(fields.creator)} started the #{fields.name} project"
      )
    end)
  end

  step :given_that_champion_has_a_manager, ctx do
    manager = person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Ursula Vonboss"})

    {:ok, champion} = Operately.People.update_person(ctx.champion, %{manager_id: manager.id})

    ctx
    |> Map.put(:champion, champion)
    |> Map.put(:manager, manager)
  end

  step :assert_reviewer_is_champions_manager, ctx, fields do
    project = Operately.Repo.get_by!(Operately.Projects.Project, name: fields.name)
    project = Operately.Repo.preload(project, [:reviewer])

    assert project.reviewer.id == ctx.manager.id
  end

  step :assert_validation_error, ctx, error do
    UI.assert_text(ctx, error)
  end

  step :assert_no_reviewer_calluout_showing, ctx do
    ctx |> UI.assert_has(testid: "no-reviewer-callout")
  end

  step :assert_review_placeholder_showing, ctx do
    ctx |> UI.assert_has(testid: "reviewer-placeholder")
  end

  step :follow_add_reviewer_link_and_add_reviewer, ctx do
    ctx
    |> UI.click(testid: "add-reviewer")
    |> UI.select_person_in(id: "person", name: ctx.reviewer.full_name)
    |> UI.click(testid: "submit")
  end

  step :assert_project_has_reviewer, ctx, fields do
    ctx
    |> UI.assert_has(testid: "project-contributors-page")
    |> UI.assert_text(ctx.reviewer.full_name)
    |> then(fn ctx ->
      project = Operately.Repo.get_by!(Operately.Projects.Project, name: fields.name)
      project = Operately.Repo.preload(project, [:reviewer])
      assert project.reviewer.id == ctx.reviewer.id

      UI.visit(ctx, Paths.project_path(ctx.company, project))
    end)
    |> UI.refute_has(testid: "no-reviewer-callout")
  end

  step :given_that_space_is_hidden_from_company_members, ctx do
    context = Access.get_context!(group_id: ctx.group.id)
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    Access.unbind(context, access_group_id: group.id)

    ctx
  end

  step :assert_form_offers_space_wide_access_level, ctx do
    ctx |> UI.assert_text("Space-wide Access")
  end

  step :change_project_access_level_to_invite_only, ctx do
    ctx
    |> UI.click(testid: "edit-access-levels")
    |> UI.select(testid: "access-spacemembers", option: "No Access")
  end

  step :assert_company_members_cant_see_project, ctx, params do
    project = Operately.Repo.get_by!(Operately.Projects.Project, name: params.name)
    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    assert Access.get_binding(context_id: context.id, group_id: group.id).access_level == Binding.no_access()

    ctx
  end

  step :assert_space_members_can_see_project, ctx, params do
    project = Operately.Repo.get_by!(Operately.Projects.Project, name: params.name)
    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(group_id: ctx.group.id, tag: :standard)

    assert Access.get_binding(context_id: context.id, group_id: group.id).access_level > Binding.no_access()

    ctx
  end

  step :assert_space_members_cant_see_project, ctx, params do
    project = Operately.Repo.get_by!(Operately.Projects.Project, name: params.name)
    context = Access.get_context!(project_id: project.id)
    group = Access.get_group!(group_id: ctx.group.id, tag: :standard)

    assert Access.get_binding(context_id: context.id, group_id: group.id).access_level == Binding.no_access()

    ctx
  end

  step :assert_project_created_feed, ctx, creator \\ nil do
    project = Repo.one(Project)
    creator = creator || ctx.champion

    ctx
    |> UI.visit(Paths.project_path(ctx.company, project))
    |> FeedSteps.assert_project_created(author: creator)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_project_created(author: creator, project_name: project.name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_created(author: creator, project_name: project.name)
  end

  defp who_should_be_notified(fields) do
    [
      {fields.champion, "champion"},
      {fields.reviewer, "reviewer"}
    ] |> Enum.filter(& elem(&1, 0).id != fields.creator.id)
  end

  defp run_if(ctx, condition, fun) do
    if condition, do: fun.(ctx), else: ctx
  end

  step :assert_project_form_prefilled_with_goal_and_its_space, ctx do
    ctx
    |> UI.assert_text("Start a new project")
    |> UI.assert_text(ctx.goal.name)
    |> UI.assert_text(ctx.group.name)
  end

end
