defmodule Operately.Tasks.TaskBoard do
  use Operately.Schema
  use Operately.Repo.Getter

  import Ecto.Query
  alias Operately.Repo

  schema "task_boards" do
    belongs_to :space, Operately.Groups.Group
    has_one :space_access_context, through: [:space, :access_context]

    has_many :tasks, Operately.Tasks.Task, foreign_key: :board_id
    embeds_many :task_statuses, Operately.Tasks.Status, on_replace: :delete

    field :name, :string
    field :tasks_kanban_state, :map, default: %{}
    field :position, :integer, default: 0
    field :archived_at, :naive_datetime

    timestamps()
    request_info()
  end

  def changeset(board \\ %__MODULE__{}, attrs) do
    board
    |> cast(attrs, [:space_id, :name, :tasks_kanban_state, :position])
    |> cast_embed(:task_statuses)
    |> validate_required([:space_id, :name, :position])
    |> validate_length(:name, max: 255, count: :codepoints)
    |> foreign_key_constraint(:space_id)
  end

  def getter_profile(:default) do
    %Operately.Repo.Getter.Profile{access_contexts: [:space_access_context]}
  end

  def default_for_space(space = %Operately.Groups.Group{}) do
    board = space.default_task_board_id && Repo.one(from b in __MODULE__, where: b.id == ^space.default_task_board_id and b.space_id == ^space.id and is_nil(b.archived_at))

    if board, do: {:ok, board}, else: {:error, :bad_request}
  end

  def task_status_values(board) do
    board.task_statuses |> List.wrap() |> Enum.map(& &1.value) |> Enum.reject(&is_nil/1) |> Enum.map(&to_string/1)
  end

  def get_default_task_status(board) do
    statuses = board.task_statuses || []
    Enum.find(statuses, &(&1.color == :gray)) || Enum.find(statuses, &(&1.color == :blue)) || List.first(statuses)
  end
end
