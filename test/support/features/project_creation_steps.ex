defmodule Operately.Support.Features.ProjectCreationSteps do
  use Operately.FeatureCase

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

    ctx = Map.merge(ctx, %{
      company: company,
      champion: champion,
      reviewer: reviewer,
      group: group,
      non_contributor: non_contributor,
      project_manager: project_manager
    })

    UI.login_based_on_tag(ctx)
  end

  step :start_adding_project, ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "projects-tab")
    |> UI.click(testid: "add-project")
  end

  step :submit_project_form, ctx, fields do
    ctx
    |> UI.fill(testid: "project-name-input", with: fields.name)
    |> UI.select_person_in(id: "Champion", name: fields.champion.full_name)
    |> UI.select_person_in(id: "Reviewer", name: fields.reviewer.full_name)
    |> then(fn ctx ->
      if fields[:add_creator_as_contributor] do
        ctx
        |> UI.click(testid: "yes-contributor")
        |> UI.fill(testid: "creator-responsibility-input", with: "Responsible for managing the project")
      else
        ctx
      end
    end)
    |> then(fn ctx ->
      if fields[:private] do
        ctx |> UI.click(testid: "invite-only")
      else
        ctx
      end
    end)
    |> UI.click(testid: "save")
    |> UI.assert_text(fields.name)
  end

  step :assert_project_created, ctx, fields do
    project = Operately.Repo.get_by!(Operately.Projects.Project, name: fields.name)
    project = Operately.Repo.preload(project, [contributors: :person])

    champion = Enum.find(project.contributors, fn c -> c.role == :champion end)
    reviewer = Enum.find(project.contributors, fn c -> c.role == :reviewer end)

    assert project.company_id == ctx.company.id
    assert project.group_id == ctx.group.id
    assert project.creator_id == fields.creator.id
    assert project.private == Map.get(fields, :private, false)

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

  defp who_should_be_notified(fields) do
    [
      {fields.champion, "champion"},
      {fields.reviewer, "reviewer"}
    ] |> Enum.filter(& elem(&1, 0).id != fields.creator.id)
  end

end
