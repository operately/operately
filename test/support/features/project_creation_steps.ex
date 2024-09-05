defmodule Operately.Support.Features.ProjectCreationSteps do
  use Operately.FeatureCase

  alias Operately.Access.Binding
  alias Operately.People.Person
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

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
      %{
        id: non_contributor.id,
        permissions: Binding.full_access(),
      },
      %{
        id: project_manager.id,
        permissions: Binding.full_access(),
      },
      %{
        id: reviewer.id,
        permissions: Binding.edit_access(),
      },
    ])

    {:ok, goal} = Operately.Goals.create_goal(champion, %{
      company_id: company.id,
      space_id: group.id,
      name: "Test Goal",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      timeframe: %{
        type: "year",
        start_date: ~D[2021-01-01],
        end_date: ~D[2021-12-31]
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
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.click(testid: "projects-tab")
    |> UI.click(testid: "add-project")
  end

  step :submit_project_form, ctx, fields do
    ctx
    |> UI.fill(testid: "name", with: fields.name)
    |> UI.select_person_in(id: "champion", name: fields.champion.full_name)
    |> run_if(fields[:reviewer], fn ctx ->
      ctx
      |> UI.select_person_in(id: "reviewer", name: fields.reviewer.full_name)
    end)
    |> run_if(fields[:goal], fn ctx ->
      ctx
      |> UI.click(testid: "goal-selector")
      |> UI.click(testid: UI.testid(["goal", fields.goal.name]))
    end)
    |> run_if(fields[:add_creator_as_contributor], fn ctx ->
      ctx
      |> UI.click(testid: "isContrib-yes")
      |> UI.fill(testid: "creatorRole", with: "Responsible for managing the project")
    end)
    |> UI.click(testid: "submit")
    |> UI.sleep(300)
  end

  step :assert_project_created, ctx, fields do
    project = Operately.Repo.get_by!(Operately.Projects.Project, name: fields.name)
    project = Operately.Repo.preload(project, [contributors: :person])

    champion = Enum.find(project.contributors, fn c -> c.role == :champion end)
    reviewer = Enum.find(project.contributors, fn c -> c.role == :reviewer end)

    assert project.company_id == ctx.company.id
    assert project.group_id == ctx.group.id
    assert project.creator_id == fields.creator.id

    assert champion.person.full_name == fields.champion.full_name
    assert reviewer.person.full_name == fields.reviewer.full_name

    assert length(project.contributors) == if fields[:add_creator_as_contributor], do: 3, else: 2

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

  defp who_should_be_notified(fields) do
    [
      {fields.champion, "champion"},
      {fields.reviewer, "reviewer"}
    ] |> Enum.filter(& elem(&1, 0).id != fields.creator.id)
  end

  defp run_if(ctx, condition, fun) do
    if condition, do: fun.(ctx), else: ctx
  end

end
