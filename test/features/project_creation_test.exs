defmodule Operately.Features.ProjectCreationTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  setup ctx do
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

    ctx = UI.login_based_on_tag(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "add project", ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "projects-tab")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person_in(id: "Champion", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "Reviewer", name: ctx.reviewer.full_name)
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")

    project = Operately.Repo.get_by!(Operately.Projects.Project, name: "Website Redesign")
    project = Operately.Repo.preload(project, :contributors)

    champion = Enum.find(project.contributors, fn c -> c.role == :champion end)
    reviewer = Enum.find(project.contributors, fn c -> c.role == :reviewer end)

    assert project.company_id == ctx.company.id
    assert project.group_id == ctx.group.id
    assert project.name == "Website Redesign"
    assert project.private == false
    assert project.creator_id == ctx.champion.id
    assert champion.person_id == ctx.champion.id
    assert reviewer.person_id == ctx.reviewer.id
    assert length(project.contributors) == 2
  end

  @tag login_as: :reviewer
  feature "add project and assign someone else as champion, myself as reviewer", ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "projects-tab")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person_in(id: "Champion", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "Reviewer", name: ctx.reviewer.full_name)
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")

    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_project_created_notification_sent(author: ctx.reviewer, role: "champion")
    |> EmailSteps.assert_project_created_email_sent(author: ctx.reviewer, project: "Website Redesign", to: ctx.champion, role: "Champion")

    project = Operately.Repo.get_by!(Operately.Projects.Project, name: "Website Redesign")
    project = Operately.Repo.preload(project, :contributors)

    champion = Enum.find(project.contributors, fn c -> c.role == :champion end)
    reviewer = Enum.find(project.contributors, fn c -> c.role == :reviewer end)

    assert project.company_id == ctx.company.id
    assert project.group_id == ctx.group.id
    assert project.name == "Website Redesign"
    assert project.private == false
    assert project.creator_id == ctx.reviewer.id
    assert champion.person_id == ctx.champion.id
    assert reviewer.person_id == ctx.reviewer.id
    assert length(project.contributors) == 2
  end

  @tag login_as: :non_contributor
  feature "add project for someone else, I'm not a contributor", ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "projects-tab")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person_in(id: "Champion", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "Reviewer", name: ctx.reviewer.full_name)
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")

    project = Operately.Repo.get_by!(Operately.Projects.Project, name: "Website Redesign")
    project = Operately.Repo.preload(project, :contributors)

    champion = Enum.find(project.contributors, fn c -> c.role == :champion end)
    reviewer = Enum.find(project.contributors, fn c -> c.role == :reviewer end)

    assert project.company_id == ctx.company.id
    assert project.group_id == ctx.group.id
    assert project.name == "Website Redesign"
    assert project.private == false
    assert project.creator_id == ctx.non_contributor.id
    assert champion.person_id == ctx.champion.id
    assert reviewer.person_id == ctx.reviewer.id
    assert length(project.contributors) == 2
  end

  @tag login_as: :project_manager
  feature "add project for someone else, I'm a contributor", ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "projects-tab")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person_in(id: "Champion", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "Reviewer", name: ctx.reviewer.full_name)
    |> UI.click(testid: "yes-contributor")
    |> UI.fill(testid: "creator-responsibility-input", with: "Responsible for managing the project")
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")

    project = Operately.Repo.get_by!(Operately.Projects.Project, name: "Website Redesign")
    project = Operately.Repo.preload(project, :contributors)

    champion = Enum.find(project.contributors, fn c -> c.role == :champion end)
    reviewer = Enum.find(project.contributors, fn c -> c.role == :reviewer end)
    manager = Enum.find(project.contributors, fn c -> c.role == :contributor end)

    assert project.company_id == ctx.company.id
    assert project.group_id == ctx.group.id
    assert project.name == "Website Redesign"
    assert project.private == false
    assert project.creator_id == ctx.project_manager.id
    assert champion.person_id == ctx.champion.id
    assert reviewer.person_id == ctx.reviewer.id
    assert manager.person_id == ctx.project_manager.id
    assert manager.responsibility == "Responsible for managing the project"
    assert length(project.contributors) == 3
  end

  @tag login_as: :champion
  feature "add a private project", ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "projects-tab")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person_in(id: "Champion", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "Reviewer", name: ctx.reviewer.full_name)
    |> UI.click(testid: "invite-only")
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")
    |> UI.assert_has(testid: "private-project-indicator")
  end

  @tag login_as: :non_contributor
  feature "add a private project as a non-contributor", ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "projects-tab")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person_in(id: "Champion", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "Reviewer", name: ctx.reviewer.full_name)
    |> UI.click(testid: "invite-only")
    |> UI.assert_text("Are you sure?")
    |> UI.click(testid: "save")
    |> UI.assert_page("/spaces/#{ctx.group.id}")
  end
end
