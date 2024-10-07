defmodule OperatelyWeb.Api.Queries.GetActivity do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Activities.Activity
  alias Operately.Activities.Preloader

  import Operately.Access.Filters, only: [filter_by_view_access: 2]
  import Ecto.Query, only: [from: 2]

  inputs do
    field :id, :string
  end

  outputs do
    field :activity, :activity
  end

  def call(conn, inputs) do
    {:ok, activity_id} = decode_id(inputs[:id])

    load(me(conn), activity_id)
    |> preload_content()
    |> serialize()
    |> case do
      nil ->
        {:error, :not_found, "Activity not found"}
      activity ->
        {:ok, %{activity: activity}}
    end
  end

  defp load(person, id) do
    query = from a in Activity,
      where: a.id == ^id,
      preload: [:author, comment_thread: [reactions: :person]]

    query
    |> filter_by_view_access(person.id)
    |> Repo.one()
  end

  defp preload_content(nil), do: nil
  defp preload_content(activity) do
    activity
    |> Activities.cast_content()
    |> Preloader.preload()
  end

  defp serialize(nil), do: nil
  defp serialize(activity) do
    OperatelyWeb.Api.Serializers.Activity.serialize(activity, [comment_thread: :full])
  end
end
