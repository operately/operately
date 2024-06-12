defmodule OperatelyWeb.Graphql.Queries.Notifications do
  use Absinthe.Schema.Notation

  object :notification_queries do
    field :notifications, list_of(non_null(:notification)) do
      arg :page, :integer
      arg :per_page, :integer

      resolve fn args, %{context: context} ->
        {:ok, list_notifications(context.current_account.person, args.page, args.per_page)}
      end
    end
  end

  def list_notifications(person, page, per_page) do
    alias Operately.Notifications.Notification
    alias Operately.Activities.Activity
    alias Operately.Activities

    import Ecto.Query, only: [from: 2]

    offset = per_page * (page - 1)
    limit = per_page

    query = from n in Notification,
      join: a in assoc(n, :activity),
      where: a.action not in ^Activity.deprecated_actions(),
      where: n.person_id == ^person.id,
      order_by: [desc: n.inserted_at],
      offset: ^offset,
      limit: ^limit,
      preload: [activity: [:author]]

    query
    |> Operately.Repo.all()
    |> Enum.map(fn n -> %{n | activity: Activities.cast_content(n.activity)} end)
  end
end
