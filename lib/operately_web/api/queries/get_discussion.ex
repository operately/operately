defmodule OperatelyWeb.Api.Queries.GetDiscussion do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :include_author, :boolean
    field :include_comments, :boolean
    field :include_reactions, :boolean
  end

  outputs do
    field :discussion, :discussion
  end

  def call(_conn, inputs) do
    update = load(inputs)

    if update do
      {:ok, %{discussion: OperatelyWeb.Api.Serializer.serialize(update, level: :full)}}
    else
      {:error, :not_found}
    end
  end

  defp load(inputs) do
    {:ok, id} = decode_id(inputs.id)
    requested = extract_include_filters(inputs)

    query = from u in Operately.Updates.Update, where: u.id == ^id
    query = query |> include_requested(requested)

    Repo.one(query)
    |> case do
      nil -> nil
      update -> Operately.Updates.Update.preload_space(update)
    end
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

end
