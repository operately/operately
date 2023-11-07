defmodule Operately.Activities do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Activities.Recorder
  alias Operately.Activities.ListActivitiesOperation

  def get_activity!(id) do
    Repo.get!(Activity, id)
  end

  def list_activities(scope_type, scope_id) do
    ListActivitiesOperation.run(scope_type, scope_id)
  end

  def insert(multi, author_id, action, callback) do
    Ecto.Multi.run(multi, :activity_recording_job, fn _repo, changes ->
      job = Recorder.new(%{
        action: action,
        author_id: author_id,
        params: callback.(changes),
      }) 

      Oban.insert(job)
    end)
  end
end
