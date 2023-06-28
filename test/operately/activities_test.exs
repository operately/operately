defmodule Operately.ActivitiesTest do
  use Operately.DataCase

  alias Operately.Activities
  alias Operately.Activities.Activity

  import Operately.CompaniesFixtures
  import Operately.ActivitiesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  setup do
    company = company_fixture()
    person = person_fixture(company_id: company.id)
    project = project_fixture(company_id: company.id, creator_id: person.id)

    activity = activity_fixture(
      scope_type: "project",
      scope_id: project.id,
      person_id: person.id,
      resource_id: project.id, 
      resource_type: "project",
      action_type: "create",
      event_data: %{
        type: "project_create",
        champion_id: person.id
      }
    )

    {:ok, %{company: company, person: person, project: project, activity: activity}}
  end

  describe "activities" do
    test "list_activities/2 returns all activities", ctx do
      activities = Activities.list_activities(ctx.activity.scope_type, ctx.activity.scope_id)

      assert length(activities) == 2

      activity = hd(activities)

      assert activity.action_type == :create
      assert activity.resource_type == :project
      assert activity.resource_id == ctx.project.id
      assert activity.person_id == ctx.person.id

      assert %Operately.Projects.Project{} = activity.resource
    end

    test "get_activity!/1 returns the activity with given id", ctx do
      activity = Activities.get_activity!(ctx.activity.id)

      assert activity.action_type == :create
      assert activity.resource_type == :project
      assert activity.resource_id == ctx.project.id
      assert activity.person_id == ctx.person.id

      assert %Operately.Projects.Project{} = activity.resource
    end

    test "create_activity/1 with valid data creates a activity", ctx do
      valid_attrs = %{
        scope_type: "project",
        scope_id: ctx.project.id,
        action_type: "create", 
        resource_id: ctx.project.id,
        resource_type: "project",
        person_id: ctx.person.id,
        event_data: %{
          type: "project_create",
          champion_id: ctx.person.id
        }
      }

      assert {:ok, %Activity{} = activity} = Activities.create_activity(valid_attrs)
      assert activity.action_type == :create
      assert activity.resource_type == :project
      assert activity.resource_id == ctx.project.id
    end

    test "create_activity/1 with invalid data returns error changeset" do
      attr = %{action_type: :create, resource_id: nil, resource_type: :project, event_data: %{}}
      assert {:error, %Ecto.Changeset{}} = Activities.create_activity(attr)
    end

    test "delete_activity/1 deletes the activity", ctx do
      assert {:ok, %Activity{}} = Activities.delete_activity(ctx.activity)
      assert_raise Ecto.NoResultsError, fn -> Activities.get_activity!(ctx.activity.id) end
    end

    test "change_activity/1 returns a activity changeset", ctx do
      assert %Ecto.Changeset{} = Activities.change_activity(ctx.activity)
    end
  end
end
