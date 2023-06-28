defmodule Operately.Activities do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Activities.Activity
  alias Operately.Activities.ResourceLoader

  def list_activities do
    query = from a in Activity,
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
end
