defmodule OperatelyWeb.Api.Queries.GetActivity do
  use TurboConnect.Query

  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Activities.Activity
  alias Operately.Activities.Preloader

  import Ecto.Query, only: [from: 2]

  inputs do
    field :id, :string
  end

  outputs do
    field :activity, :activity
  end

  def call(_conn, inputs) do
    activity = load(inputs[:id])
    serialized = OperatelyWeb.Api.Serializers.Activity.serialize(activity, [comment_thread: :full])

    {:ok, %{activity: serialized}}
  end

  def load(id) do
    query = from a in Activity, 
      where: a.id == ^id, 
      preload: [:author, comment_thread: [comments: :author, reactions: :author]]

    record = query |> Repo.one() |> Activities.cast_content()

    [record]
    |> Preloader.preload(:project)
    |> Preloader.preload(:goal)
    |> Preloader.preload(:group)
    |> Preloader.preload(:update)
    |> Preloader.preload(:person)
    |> Preloader.preload(:project_check_in)
    |> Preloader.preload(:activity)
    |> hd()
  end
end
