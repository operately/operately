defmodule Operately.Data.Change042PopulateMessagesBoardIdFieldInMessages do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  def run do
    Repo.transaction(fn ->
      from(s in Operately.Groups.Group, select: s.id)
      |> Repo.all()
      |> create_boards()
    end)
  end

  defp create_boards(space_ids) when is_list(space_ids) do
    Enum.each(space_ids, &(create_boards(&1)))
  end

  defp create_boards(space_id) do
    {:ok, board_id} = Ecto.UUID.dump(Ecto.UUID.generate())
    {:ok, space_id} = Ecto.UUID.dump(space_id)

    {1, nil} = Repo.insert_all("messages_boards", [[id: board_id, space_id: space_id, name: "Messages Board", inserted_at: DateTime.utc_now(), updated_at: DateTime.utc_now()]])

    from(m in "messages", where: m.space_id == ^space_id and is_nil(m.messages_board_id))
    |> Repo.update_all(set: [
      messages_board_id: board_id,
    ])
  end
end
