defmodule Operately.Support.Features.ProjectContributorsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Access.Binding
  alias Operately.People.Person

  import Operately.PeopleFixtures

  defdelegate login(ctx), to: ProjectSteps
  defdelegate visit_project_page(ctx), to: ProjectSteps
  defdelegate create_project(ctx, attrs), to: ProjectSteps

  step :visit_project_contributors_page, ctx do
    ctx 
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "manage-team-button")
    |> UI.assert_has(testid: "project-contributors-page")
  end

  step :given_a_person_exists, ctx, name: name do
    person_fixture_with_account(%{
      full_name: name,
      title: "Manager",
      company_id: ctx.company.id
    })

    ctx
  end

  step :given_a_contributor_exists, ctx, name: name do
    contrib = person_fixture_with_account(%{full_name: name, title: "Manager", company_id: ctx.company.id})

    {:ok, _} = Operately.Projects.create_contributor(contrib, %{
      person_id: contrib.id,
      role: "contributor",
      project_id: ctx.project.id,
      responsibility: "Lead the backend implementation",
      permissions: Binding.edit_access(),
    })

    ctx
  end

  step :add_contributor, ctx, name: name, responsibility: responsibility do
    ctx
    |> UI.click(testid: "manage-team-button")
    |> UI.click(testid: "add-contributor-button")
    |> UI.select_person_in(id: "person", name: name)
    |> UI.fill(testid: "responsibility", with: responsibility)
    |> UI.click(testid: "submit")
    |> UI.sleep(200)
  end

  step :assert_contributor_added, ctx, name: name, responsibility: responsibility do
    ctx
    |> UI.assert_text(name)
    |> UI.assert_text(responsibility)

    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)

    assert contrib != nil
    assert contrib.responsibility == responsibility

    ctx
  end

  step :assert_contributor_added_feed_item_exists, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)
    name = Person.first_name(contrib.person)

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_feed_item(ctx.champion, "added #{name} to the project")
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.assert_feed_item(ctx.champion, "added #{name} to the #{ctx.project.name} project")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.champion, "added #{name} to the #{ctx.project.name} project")
  end

  step :assert_contributor_removed_feed_item_exists, ctx, name: name do
    name = Person.get_by!(:system, full_name: name) |> Person.first_name()

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_feed_item(ctx.champion, "removed #{name} from the project")
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.assert_feed_item(ctx.champion, "removed #{name} from the #{ctx.project.name} project")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.champion, "removed #{name} from the #{ctx.project.name} project")
  end

  step :assert_contributor_added_notification_sent, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)

    ctx
    |> UI.login_as(contrib.person)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "added you as a contributor"
    })
  end

  step :assert_contributor_added_email_sent, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: contrib.person,
      author: ctx.champion,
      action: "added you as a contributor"
    })
  end

  step :given_the_project_has_contributor, ctx, name: name do
    contrib = person_fixture_with_account(%{full_name: name, title: "Manager", company_id: ctx.company.id})

    {:ok, _} = Operately.Projects.create_contributor(contrib, %{
      person_id: contrib.id,
      role: "contributor",
      project_id: ctx.project.id,
      responsibility: "Lead the backend implementation",
      permissions: Binding.edit_access(),
    })

    ctx
  end

  step :remove_contributor, ctx, name: name do
    ctx
    |> UI.click(testid: "manage-team-button")
    |> UI.click(testid: UI.testid(["contributor-menu", name]))
    |> UI.click(testid: "remove-contributor")
    |> UI.sleep(200)
  end

  step :assert_contributor_removed, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)

    assert contrib == nil

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "manage-team-button")
    |> UI.refute_has(Query.text("Michael Scott"))
  end

  step :assert_reviewer_removed, ctx do 
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    refute Enum.find(contributors, fn c -> c.role == "reviewer" end)

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "manage-team-button")
    |> UI.refute_has(Query.text(ctx.reviewer.full_name))
    |> UI.assert_text("No Reviewer")
    |> UI.assert_has(testid: "add-reviewer-button")
  end

  step :convert_reviewer_to_contributor, ctx, params do
    ctx
    |> UI.click(testid: "manage-team-button")
    |> UI.click(testid: UI.testid(["contributor-menu", params.name]))
    |> UI.click(testid: "convert-to-contributor")
    |> UI.fill(testid: "responsibility", with: params.responsibility)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "project-contributors-page")
  end

  step :convert_champion_to_contributor, ctx, params do
    ctx
    |> UI.click(testid: "manage-team-button")
    |> UI.click(testid: UI.testid(["contributor-menu", params.name]))
    |> UI.click(testid: "convert-to-contributor")
    |> UI.fill(testid: "responsibility", with: params.responsibility)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "project-contributors-page")
  end

  step :assert_reviewer_converted_to_contributor, ctx, params do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    reviewer = Enum.find(contributors, fn c -> c.role == "reviewer" end)

    assert reviewer == nil

    ctx
    |> UI.assert_text(params.name)
    |> UI.assert_text(params.responsibility)
  end

  step :assert_champion_converted_to_contributor, ctx, params do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    champion = Enum.find(contributors, fn c -> c.role == "champion" end)

    assert champion == nil

    ctx
    |> UI.assert_text(params.name)
    |> UI.assert_text(params.responsibility)
  end

  step :assert_reviewer_converted_to_contributor_feed_item_exists, ctx do
    name = Person.first_name(ctx.reviewer)
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_feed_item(ctx.champion, "reassigned #{name} as a contributor")
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.assert_feed_item(ctx.champion, "reassigned #{name} as a contributor on the #{ctx.project.name} project")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.champion, "reassigned #{name} as a contributor on the #{ctx.project.name} project")
  end

  step :assert_champion_converted_to_contributor_feed_item_exists, ctx do
    name = Person.first_name(ctx.champion)

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_feed_item(ctx.champion, "reassigned #{name} as a contributor")
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.assert_feed_item(ctx.champion, "reassigned #{name} as a contributor on the #{ctx.project.name} project")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.champion, "reassigned #{name} as a contributor on the #{ctx.project.name} project")
  end

  step :given_company_members_have_access, ctx do
    person = person_fixture_with_account(%{
      company_id: ctx.company.id,
      full_name: "Michael Scott"
    })


    Map.put(ctx, :company_member, person)
  end

  step :expand_show_other_people, ctx do
    ctx
    |> UI.click(testid: "show-all-other-people")
    |> UI.assert_has(testid: "other-people-list")
  end

  step :assert_other_people_listed, ctx do
    UI.find(ctx, UI.query(testid: "other-people-list"), fn ctx ->
      assert UI.assert_text(ctx, ctx.company_member.full_name)
    end)
  end

  step :choose_new_champion, ctx, name: name do
    person_fixture_with_account(%{company_id: ctx.company.id, full_name: name})

    ctx
    |> UI.click(testid: UI.testid(["contributor-menu", ctx.champion.full_name]))
    |> UI.click(testid: "choose-new-champion")
    |> UI.select_person_in(id: "person", name: name)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "project-contributors-page")
  end

  step :assert_new_champion_is, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    champion = Enum.find(contributors, fn c -> c.role == :champion end)

    assert champion.person.full_name == name

    ctx
  end

  step :assert_old_champion_is_contributor, ctx do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    champion = Enum.find(contributors, fn c -> c.person_id == ctx.champion.id end)

    assert champion.role == :contributor

    ctx
  end

  step :assert_new_champion_chosen_feed_item_exists, ctx, name: name do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_feed_item(ctx.champion, "set #{name} as the new champion")
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.assert_feed_item(ctx.champion, "set #{name} as the new champion on the #{ctx.project.name} project")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.champion, "set #{name} as the new champion on the #{ctx.project.name} project")
  end

  step :choose_new_reviewer, ctx, name: name do
    person_fixture_with_account(%{company_id: ctx.company.id, full_name: name})

    ctx
    |> UI.click(testid: UI.testid(["contributor-menu", ctx.reviewer.full_name]))
    |> UI.click(testid: "choose-new-reviewer")
    |> UI.select_person_in(id: "person", name: name)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "project-contributors-page")
  end

  step :assert_new_reviewer_is, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    reviewer = Enum.find(contributors, fn c -> c.role == :reviewer end)

    assert reviewer.person.full_name == name

    ctx
  end

  step :assert_old_reviewer_is_contributor, ctx do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    reviewer = Enum.find(contributors, fn c -> c.person_id == ctx.reviewer.id end)

    assert reviewer.role == :contributor

    ctx
  end

  step :assert_new_reviewer_chosen_feed_item_exists, ctx, name: name do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_feed_item(ctx.champion, "set #{name} as the new reviewer")
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.assert_feed_item(ctx.champion, "set #{name} as the new reviewer on the #{ctx.project.name} project")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.champion, "set #{name} as the new reviewer on the #{ctx.project.name} project")
  end

  step :promote_contributor_to_champion, ctx, name: name do
    promote_to(ctx, name, "champion")
  end

  step :promote_contributor_to_reviewer, ctx, name: name do
    promote_to(ctx, name, "reviewer")
  end

  #
  # Helpers
  #

  defp promote_to(ctx, name, role) do
    ctx
    |> UI.click(testid: UI.testid(["contributor-menu", name]))
    |> UI.click(testid: "promote-to-#{role}")
    |> UI.sleep(500)
  end

end
