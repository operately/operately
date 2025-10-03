defmodule Operately.Operations.ProjectResumingTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Operations.ProjectResuming

  describe "run/2" do
    setup do
      company = company_fixture()
      creator = person_fixture(%{company_id: company.id})
      space = group_fixture(creator, %{company_id: company.id})
      
      # Create a project with next_check_in_scheduled_at in the past (simulating paused project)
      past_date = DateTime.utc_now() |> DateTime.add(-14, :day) # 2 weeks ago
      project = project_fixture(%{
        company_id: company.id,
        creator_id: creator.id,
        group_id: space.id,
        next_check_in_scheduled_at: past_date,
        status: "paused"
      })

      %{company: company, creator: creator, space: space, project: project, past_date: past_date}
    end

    test "resuming project updates status to active", ctx do
      {:ok, updated_project} = ProjectResuming.run(ctx.creator, ctx.project)
      
      assert updated_project.status == "active"
    end

    test "resuming project updates next_check_in_scheduled_at to avoid immediate check-in", ctx do
      {:ok, updated_project} = ProjectResuming.run(ctx.creator, ctx.project)
      
      # The next check-in should be scheduled for the next Friday (at least a week from now)
      today = DateTime.utc_now()
      next_friday = Operately.Time.first_friday_from_today()
      
      assert updated_project.next_check_in_scheduled_at >= next_friday
      assert updated_project.next_check_in_scheduled_at > today
      
      # Should not be the old past date
      assert updated_project.next_check_in_scheduled_at != ctx.past_date
    end

    test "creates project_resuming activity", ctx do
      {:ok, _updated_project} = ProjectResuming.run(ctx.creator, ctx.project)
      
      activity = Operately.Activities.list_activities()
                 |> Enum.find(&(&1.action == :project_resuming))
      
      assert activity != nil
      assert activity.author_id == ctx.creator.id
      assert activity.content["project_id"] == ctx.project.id
    end
  end
end