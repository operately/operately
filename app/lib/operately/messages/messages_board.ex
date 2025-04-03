defmodule Operately.Messages.MessagesBoard do
  use Operately.Schema

  schema "messages_boards" do
    belongs_to :space, Operately.Groups.Group, foreign_key: :space_id

    field :name, :string
    field :description, :map

    has_many :messages, Operately.Messages.Message, foreign_key: :messages_board_id

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(update, attrs) do
    update
    |> cast(attrs, [:space_id, :name, :description])
    |> validate_required([:space_id, :name])
  end

  #
  # After load hooks
  #

  def load_messages_comments_count(messages_boards) when is_list(messages_boards) do
    Enum.map(messages_boards, fn board ->
      messages = Operately.Messages.Message.load_comments_count(board.messages)
      Map.put(board, :messages, messages)
    end)
  end
end
