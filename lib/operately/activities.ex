defmodule Operately.Activities do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Activities.Activity
  alias Operately.Activities.ResourceLoader

  def list_activities(scope_type, scope_id) do
    query = from a in Activity,
      where: a.scope_type == ^scope_type and a.scope_id == ^scope_id,
      order_by: [desc: a.inserted_at],
      preload: [:person]

    activities = Repo.all(query)
    activities = ResourceLoader.load_resources(activities)

    activities
  end

  def get_activity!(id) do
    activity = Repo.get!(Activity, id)
    activity = ResourceLoader.load_resources([activity])

    hd(activity)
  end

  def create_activity(attrs \\ %{}) do
    %Activity{}
    |> Activity.changeset(attrs)
    |> Repo.insert()
  end

  def delete_activity(%Activity{} = activity) do
    Repo.delete(activity)
  end

  def change_activity(%Activity{} = activity, attrs \\ %{}) do
    Activity.changeset(activity, attrs)
  end

  # Activity Types

  def submit_project_created(project, champion \\ nil) do
    champion_id = if champion, do: champion.person_id, else: nil

    create_activity(%{
      :person_id => project.creator_id,
      :resource_id => project.id,
      :resource_type => "project",
      :action_type => :create,
      :scope_type => :project,
      :scope_id => project.id,
      :event_data => %{
        :type => "project_create",
        :champion_id => champion_id
      }
    })
  end

  def submit_milestone_created(creator_id, milestone) do
    create_activity(%{
      :person_id => creator_id,
      :resource_id => milestone.id,
      :resource_type => "milestone",
      :action_type => :create,
      :scope_type => :project,
      :scope_id => milestone.project_id,
      :event_data => %{
        :type => "milestone_create",
        :title => milestone.title,
        :deadline_at => milestone.deadline_at
      }
    })
  end

  def submit_milestone_completed(person_id, milestone) do
    create_activity(%{
      :person_id => person_id,
      :resource_id => milestone.id,
      :resource_type => "milestone",
      :action_type => :complete,
      :scope_type => :project,
      :scope_id => milestone.project_id,
      :event_data => %{
        :type => "milestone_uncomplete",
        :title => milestone.title,
        :deadline_at => milestone.deadline_at
      }
    })
  end

  def submit_milestone_uncompleted(person_id, milestone) do
    create_activity(%{
      :person_id => person_id,
      :resource_id => milestone.id,
      :resource_type => "milestone",
      :action_type => :uncomplete,
      :scope_type => :project,
      :scope_id => milestone.project_id,
      :event_data => %{
        :type => "milestone_uncomplete",
        :title => milestone.title,
        :deadline_at => milestone.deadline_at
      }
    })
  end

  def submit_update_posted(update) do
    Operately.Activities.create_activity(%{
      action_type: :post,
      resource_type: :update,
      resource_id: update.id,
      person_id: update.author_id,
      scope_type: :project,
      scope_id: update.updatable_id,
      event_data: %{
        type: "update_post"
      }
    })
  end
end
