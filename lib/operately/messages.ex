defmodule Operately.Messages do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.Messages.Message

  def list_messages(space_id) do
    from(m in Message, where: m.space_id == ^space_id)
    |> Repo.all()
  end

  def create_message(attrs) do
    %Message{}
    |> Message.changeset(attrs)
    |> Repo.insert()
  end
end
