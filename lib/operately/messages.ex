defmodule Operately.Messages do
  alias Operately.Repo
  alias Operately.Messages.Message

  def create_message(attrs) do
    %Message{}
    |> Message.changeset(attrs)
    |> Repo.insert()
  end
end
