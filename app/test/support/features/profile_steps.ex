defmodule Operately.Support.Features.ProfileSteps do
  use Operately.FeatureCase

  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.ProjectsFixtures

  step :given_a_person_exists_with_manager_reports_and_peers, ctx do
    company = company_fixture()

    manager = person_fixture_with_account(%{company_id: company.id, full_name: "John Coltrane", manager_id: nil})
    person = person_fixture_with_account(%{company_id: company.id, full_name: "Miles Davis", manager_id: manager.id})

    space = group_fixture(manager, %{company_id: company.id})
    {:ok, _} = Operately.Groups.add_members(manager, space.id, [
      %{id: person.id, access_level: Operately.Access.Binding.full_access()}
    ])

    report_1 = person_fixture_with_account(%{company_id: company.id, full_name: "Bill Evans", manager_id: person.id})
    report_2 = person_fixture_with_account(%{company_id: company.id, full_name: "Herbie Hancock", manager_id: person.id})
    report_3 = person_fixture_with_account(%{company_id: company.id, full_name: "Chick Corea", manager_id: person.id})

    peer_1 = person_fixture_with_account(%{company_id: company.id, full_name: "Wayne Shorter", manager_id: manager.id})
    peer_2 = person_fixture_with_account(%{company_id: company.id, full_name: "Joe Zawinul", manager_id: manager.id})

    peers = [peer_1, peer_2]
    reports = [report_1, report_2, report_3]

    Map.merge(ctx, %{
      creator: manager,
      person: person,
      manager: manager,
      reports: reports,
      peers: peers,
      company: company,
      space: space,
    })
  end

  step :visit_profile_page, ctx do
    UI.visit(ctx, Paths.profile_path(ctx.company, ctx.person))
  end

  step :visit_profile_edit_page, ctx do
    UI.visit(ctx, Paths.profile_path(ctx.company, ctx.person) <> "/profile/edit")
  end

  step :assert_contact_email_visible, ctx do
    UI.assert_text(ctx, ctx.person.email)
  end

  step :assert_manager_visible, ctx do
    UI.assert_text(ctx, ctx.manager.full_name)
  end

  step :assert_reports_visible, ctx do
    Enum.each(ctx.reports, &UI.assert_text(ctx, &1.full_name))
    ctx
  end

  step :assert_peers_visible, ctx do
    Enum.each(ctx.peers, &UI.assert_text(ctx, &1.full_name))
    ctx
  end

  step :click_manager, ctx do
    UI.click(ctx, testid: "person-card-#{OperatelyWeb.Paths.person_id(ctx.manager)}")
  end

  step :assert_on_manager_profile, ctx do
    UI.assert_page(ctx, Paths.profile_path(ctx.company, ctx.manager))
  end

  step :assert_person_listed_as_report_on_manager_profile, ctx do
    UI.assert_text(ctx, ctx.person.full_name)
  end

  step :given_goals_exist_for_person, ctx do
    peer = hd(ctx.peers)

    goal1 = goal_fixture(ctx.person, %{
      company_id: ctx.company.id,
      space_id: ctx.company.company_space_id,
      reviewer_id: peer.id,
      name: "Improve support first response time",
    })

    goal2 = goal_fixture(ctx.person, %{
      company_id: ctx.company.id,
      space_id: ctx.company.company_space_id,
      champion_id: peer.id,
      reviewer_id: ctx.person.id,
      name: "Increase customer satisfaction",
    })

    Map.merge(ctx, %{goals: [goal1, goal2], goal1: goal1, goal2: goal2})
  end

  step :given_projects_exist_for_person, ctx do
    peer = hd(ctx.peers)

    project1 = project_fixture(%{
      company_id: ctx.company.id,
      group_id: ctx.company.company_space_id,
      creator_id: ctx.person.id,
      champion_id: ctx.person.id,
      reviewer_id: peer.id,
      name: "Project 1",
    })

    project2 = project_fixture(%{
      company_id: ctx.company.id,
      group_id: ctx.company.company_space_id,
      creator_id: ctx.person.id,
      champion_id: peer.id,
      reviewer_id: ctx.person.id,
      name: "Project 2",
    })

    Map.merge(ctx, %{projects: [project1, project2], project1: project1, project2: project2})
  end

  step :given_task_assigned_to_person, ctx, opts \\ [] do
    task_key = Keyword.get(opts, :task_key, :task)
    project_key = Keyword.get(opts, :project_key, :"#{task_key}_project")
    task_name = Keyword.get(opts, :task_name, "Task #{task_key}")
    project_name = Keyword.get(opts, :project_name, "Project #{task_key}")

    ctx =
      ctx
      |> Map.put(:creator, ctx.person)
      |> Factory.add_project(project_key, :space, [
        name: project_name,
        champion: :person,
        reviewer: :manager
      ])

    ctx =
      ctx
      |> Factory.add_project_task(task_key, nil, [
        name: task_name,
        project_id: ctx[project_key].id
      ])
      |> Factory.add_task_assignee(:"#{task_key}_assignee", task_key, :person)

    ctx
  end

  step :given_task_project_is_closed, ctx, opts \\ [] do
    project_key = Keyword.get(opts, :project_key, :task_project)

    ctx
    |> Map.put(:creator, ctx.person)
    |> Factory.close_project(project_key)
  end

  step :given_task_project_is_paused, ctx, opts \\ [] do
    project_key = Keyword.get(opts, :project_key, :task_project)

    ctx
    |> Map.put(:creator, ctx.person)
    |> Factory.pause_project(project_key)
  end

  step :given_task_has_closed_status, ctx, opts \\ [] do
    task_key = Keyword.get(opts, :task_key)
    project_key = Keyword.get(opts, :project_key)

    project = Map.fetch!(ctx, project_key)
    task = Map.fetch!(ctx, task_key)

    closed_status = Enum.find(project.task_statuses, & &1.closed)

    assert closed_status

    {:ok, task} =
      Operately.Tasks.update_task(task, %{
        task_status: status_to_map(closed_status)
      })

    Map.put(ctx, task_key, task)
  end

  step :given_goal_with_user_as_reviewer_exists, ctx do
    Factory.add_goal(ctx, :goal, :space, [
      name: "Improve support first response time",
      reviewer: :person,
      champion: :manager
    ])
  end

  step :given_project_with_user_as_reviewer_exists, ctx do
    Factory.add_project(ctx, :project, :space, [
      name: "Deploy new feature",
      reviewer: :person,
      champion: :manager
    ])
  end

  step :given_a_goal_is_closed, ctx, opts \\ [] do
    goal_key = Keyword.get(opts, :goal_key, :goal1)

    Factory.close_goal(ctx, goal_key)
  end

  step :given_a_project_is_closed, ctx, opts \\ [] do
    project_key = Keyword.get(opts, :project_key, :project1)

    Factory.close_project(ctx, project_key)
  end

  step :given_a_project_is_paused, ctx, opts \\ [] do
    project_key = Keyword.get(opts, :project_key, :project1)

    Factory.pause_project(ctx, project_key)
  end

  step :click_about_tab, ctx do
    UI.click(ctx, testid: "tab-about")
  end

  step :click_reviewing_tab, ctx do
    UI.click(ctx, testid: "tab-reviewing")
  end

  step :click_assigned_tab, ctx do
    UI.click(ctx, testid: "tab-assigned")
  end

  step :click_tasks_tab, ctx do
    UI.click(ctx, testid: "tab-tasks")
  end

  step :click_completed_tab, ctx do
    UI.click(ctx, testid: "tab-completed")
  end

  step :click_paused_tab, ctx do
    UI.click(ctx, testid: "tab-paused")
  end

  step :assert_assignments_email_enabled, ctx do
    ctx
    |> UI.assert_has(testid: "disable-assignments-email-toggle")
  end

  step :disable_assignments_email, ctx do
    ctx
    |> UI.click(testid: "disable-assignments-email-toggle")
    |> UI.sleep(100)
    |> UI.click(testid: "submit")
    |> UI.assert_page(Paths.account_path(ctx.company))
  end

  step :enable_assignments_email, ctx do
    ctx
    |> UI.click(testid: "enable-assignments-email-toggle")
    |> UI.sleep(100)
    |> UI.click(testid: "submit")
    |> UI.assert_page(Paths.account_path(ctx.company))
  end

  step :assert_person_not_in_assignments_cron, ctx do
    people = OperatelyEmail.Assignments.Cron.people_who_want_assignment_emails()

    refute Enum.any?(people, fn person -> person.id == ctx.person.id end)

    ctx
  end

  step :assert_person_in_assignments_cron, ctx do
    people = OperatelyEmail.Assignments.Cron.people_who_want_assignment_emails()

    assert Enum.any?(people, fn person -> person.id == ctx.person.id end)

    ctx
  end

  step :assert_assinged_goals_and_projects_visible, ctx do
    ctx
    |> UI.assert_text(Enum.at(ctx.goals, 0).name)
    |> UI.assert_text(Enum.at(ctx.projects, 0).name)
  end

  step :assert_reviewing_goals_and_projects_visible, ctx do
    ctx
    |> UI.assert_text(Enum.at(ctx.goals, 1).name)
    |> UI.assert_text(Enum.at(ctx.projects, 1).name)
  end

  step :refute_assinged_goals_and_projects_visible, ctx do
    ctx
    |> UI.refute_text(Enum.at(ctx.goals, 0).name)
    |> UI.refute_text(Enum.at(ctx.projects, 0).name)
  end

  step :refute_reviewing_goals_and_projects_visible, ctx do
    ctx
    |> UI.refute_text(Enum.at(ctx.goals, 1).name)
    |> UI.refute_text(Enum.at(ctx.projects, 1).name)
  end

  step :assert_only_completed_goals_and_projects_visible, ctx do
    ctx
    |> UI.assert_text(ctx.goal1.name)
    |> UI.assert_text(ctx.project1.name)
    |> UI.refute_text(ctx.goal2.name)
    |> UI.refute_text(ctx.project2.name)
  end

  step :assert_only_paused_project_visible, ctx do
    ctx
    |> UI.assert_text(ctx.project1.name)
    |> UI.refute_text(ctx.project2.name)
    |> UI.refute_text(ctx.goal1.name)
    |> UI.refute_text(ctx.goal2.name)
  end

  step :assert_item_visible, ctx, name: name do
    UI.assert_text(ctx, name)
  end

  step :refute_item_visible, ctx, name: name do
    UI.refute_text(ctx, name)
  end

  step :given_space_task_assigned_to_person, ctx, task_name: task_name do
    ctx
    |> Map.put(:creator, ctx.person)
    |> Factory.create_space_task(:space_task, :space, [name: task_name])
    |> Factory.add_task_assignee(:space_task_assignee, :space_task, :person)
  end

  step :click_task, ctx, task_name: task_name do
    UI.click_link(ctx, task_name)
  end

  step :assert_on_task_page, ctx do
    ctx
    |> UI.sleep(200)
    |> UI.assert_page(Paths.project_task_path(ctx.company, ctx.task))
    |> UI.assert_text(ctx.task.name)
  end

  step :assert_on_space_kanban_page, ctx do
    ctx
    |> UI.assert_page(Paths.space_kanban_path(ctx.company, ctx.space))
  end

  step :assert_task_slide_in_open, ctx, task_name: task_name do
    ctx
    |> UI.assert_has(testid: "task-slide-in")
    |> UI.find([testid: "task-slide-in"], fn ctx ->
      UI.assert_text(ctx, task_name)
    end)
  end

  defp status_to_map(status) do
    %{
      id: status.id,
      label: status.label,
      color: status.color,
      index: status.index,
      value: status.value,
      closed: status.closed
    }
  end
end
