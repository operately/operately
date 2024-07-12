defmodule OperatelyWeb.Api.Queries.GetActivity do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

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
    {:ok, id} = decode_id(inputs[:id])
    activity = load(id)
    serialized = OperatelyWeb.Api.Serializers.Activity.serialize(activity, [comment_thread: :full])

    {:ok, %{activity: serialized}}
  end

  def load(id) do
    query = from a in Activity, 
      where: a.id == ^id, 
      preload: [:author, comment_thread: [comments: [:author, reactions: :person], reactions: :person]]

    query 
    |> Repo.one() 
    |> Activities.cast_content() 
    |> Preloader.preload()
  end
end
