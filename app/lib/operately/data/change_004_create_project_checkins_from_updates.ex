defmodule Operately.Data.Change004CreateProjectCheckinsFromUpdates do
  import Ecto.Query
  import Ecto.Changeset, only: [change: 2]
  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Ecto.Multi

  def run do
    activities = Repo.all(from a in Activity, where: a.action == "project_status_update_submitted")

    Enum.each(activities, fn activity ->
      create_project_check_in_for(activity)
    end)
  end

  def create_project_check_in_for(activity) do
    status_update_id = activity.content["status_update_id"]

    IO.puts "Creating project check-in for status update #{status_update_id}"

    update = Repo.get!(Operately.Updates.Update, status_update_id)

    IO.puts "Found update from #{update.inserted_at}"

    old_status = get_in(update.content, ["health", "status", "value"])
    new_status = calculate_new_status(old_status)

    IO.puts "Status Change: #{old_status} -> #{new_status}"

    description = update.content["message"]
    project_id = update.updatable_id

    check_in = %Operately.Projects.CheckIn{
      author_id: update.author_id,
      project_id: project_id,
      status: new_status,
      description: description,
      inserted_at: update.inserted_at,
      updated_at: update.updated_at,
      acknowledged_by_id: update.acknowledging_person_id,
      acknowledged_at: update.acknowledged_at
    }

    Multi.new()
    |> Multi.insert(:check_in, check_in)
    |> Multi.update(:activity, fn changes ->
      new_content = Map.put(activity.content, "check_in_id", changes.check_in.id)
      change(activity, action: "project_check_in_submitted", content: new_content)
    end)
    |> Repo.transaction()

    IO.puts "Done creating project check-in for status update #{status_update_id}"
  rescue
    e ->
      IO.puts "Error creating project check-in for activity #{activity.id}"
      IO.inspect e
      IO.inspect activity
  end

  def calculate_new_status(old_status) do
    case old_status do
      "on_track" -> "on_track"
      "at_risk" -> "caution"
      "off_track" -> "issue"
      "paused" -> "on_track"
      _ -> raise "Unknown status: #{old_status}"
    end
  end
end
