defmodule OperatelyWeb.Api.Queries.GetDiscussion do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Access.Filters
  alias Operately.Updates.Update
  alias Operately.Groups.Group

  inputs do
    field :id, :string
    field :include_author, :boolean
    field :include_comments, :boolean
    field :include_reactions, :boolean
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    update = load_update(inputs)
    update = preload_space(update, me(conn))

    if update do
      {:ok, %{discussion: OperatelyWeb.Api.Serializer.serialize(update, level: :full)}}
    else
      {:error, :not_found}
    end
  end

  defp load_update(inputs) do
    {:ok, id} = decode_id(inputs.id)
    requested = extract_include_filters(inputs)

    from(u in Update, where: u.id == ^id)
    |> include_requested(requested)
    |> Repo.one()
  end

  defp include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_author -> from p in q, preload: [:author]
        :include_comments -> from p in q, preload: [comments: [:author, [reactions: :person]]]
        :include_reactions -> from p in q, preload: [reactions: :person]
        :include_space -> q # this is done after the load
        e -> raise "Unknown include filter: #{e}"
      end
    end)
  end

  defp preload_space(nil, _), do: nil
  defp preload_space(update, person) do
    from(s in Group, where: s.id == ^update.updatable_id)
    |> Filters.filter_by_view_access(person.id)
    |> Repo.one()
    |> space_into_update(update)
  end

  defp space_into_update(nil, _), do: nil
  defp space_into_update(space, update) do
    %{update | space: space}
  end
end
