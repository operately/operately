defmodule Operately.Messages do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.Messages.Message

  def list_messages(space_id) do
    from(m in Message, join: s in assoc(m, :space), where: s.id == ^space_id)
    |> Repo.all()
  end

  def create_message(attrs) do
    %Message{}
    |> Message.changeset(attrs)
    |> Repo.insert()
  end

  def update_message(%Message{} = message, attrs) do
    message
    |> Message.changeset(attrs)
    |> Repo.update()
  end

  alias Operately.Messages.MessagesBoard

  def get_messages_board(attrs) when is_list(attrs), do: Repo.get_by(MessagesBoard, attrs)
  def get_messages_board!(attrs) when is_list(attrs), do: Repo.get_by!(MessagesBoard, attrs)

  def create_messages_board(attrs) do
    %MessagesBoard{}
    |> MessagesBoard.changeset(attrs)
    |> Repo.insert()
  end
end
