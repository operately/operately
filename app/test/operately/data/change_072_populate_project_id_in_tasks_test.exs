defmodule Operately.Data.Change072PopulateProjectIdInTasksTest do
  use Operately.DataCase

  alias Operately.Tasks

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator)
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: group.id})
    milestone = milestone_fixture(%{project_id: project.id, creator_id: creator.id})

    %{
      company: company,
      creator: creator,
      group: group,
      project: project,
      milestone: milestone
    }
  end

  test "populates project_id for tasks that belong to milestones", %{creator: creator, project: project, milestone: milestone} do
    task1 =
      task_fixture(%{
        creator_id: creator.id,
        milestone_id: milestone.id,
        project_id: project.id
      })

    task2 =
      task_fixture(%{
        creator_id: creator.id,
        milestone_id: milestone.id,
        project_id: project.id
      })

    task3 =
      task_fixture(%{
        creator_id: creator.id,
        milestone_id: nil,
        project_id: project.id
      })

    # Use raw query to set project_id to NULL to simulate pre-migration state
    task1_binary = Ecto.UUID.dump!(task1.id)
    task2_binary = Ecto.UUID.dump!(task2.id)
    task3_binary = Ecto.UUID.dump!(task3.id)

    Operately.Repo.query!("UPDATE tasks SET project_id = NULL WHERE id IN ($1, $2, $3)", [task1_binary, task2_binary, task3_binary])

    # Verify initial state
    assert Tasks.get_task!(task1.id).project_id == nil
    assert Tasks.get_task!(task2.id).project_id == nil
    assert Tasks.get_task!(task3.id).project_id == nil

    Operately.Data.Change072PopulateProjectIdInTasks.run()

    assert Tasks.get_task!(task1.id).project_id == project.id
    assert Tasks.get_task!(task2.id).project_id == project.id

    assert Tasks.get_task!(task3.id).project_id == nil
  end

  test "does not update tasks that already have project_id set", %{company: company, creator: creator, group: group} do
    project1 = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: group.id})
    project2 = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: group.id})

    milestone = milestone_fixture(%{project_id: project1.id, creator_id: creator.id})

    task =
      task_fixture(%{
        creator_id: creator.id,
        milestone_id: milestone.id,
        project_id: project2.id
      })

    # Verify initial state
    assert Tasks.get_task!(task.id).project_id == project2.id

    Operately.Data.Change072PopulateProjectIdInTasks.run()

    assert Tasks.get_task!(task.id).project_id == project2.id
  end
end
