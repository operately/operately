defmodule Operately.Tasks.TaskBoard do
  use Operately.Schema
  use Operately.Repo.Getter
  use Gettext, backend: OperatelyWeb.Gettext

  alias Ecto.Multi
  alias Operately.Repo

  schema "task_boards" do
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project

    has_one :space_access_context, through: [:space, :access_context]
    has_one :project_access_context, through: [:project, :access_context]

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
    |> cast(attrs, [:space_id, :project_id, :name, :tasks_kanban_state, :position])
    |> cast_embed(:task_statuses)
    |> validate_required([:name, :position])
    |> validate_owner()
    |> validate_length(:name, max: 255, count: :codepoints)
    |> foreign_key_constraint(:space_id)
    |> foreign_key_constraint(:project_id)
    |> unique_constraint(:project_id)
  end

  defp validate_owner(changeset) do
    if is_nil(get_field(changeset, :space_id)) == is_nil(get_field(changeset, :project_id)),
      do: add_error(changeset, :project_id, "exactly one board owner is required"),
      else: changeset
  end

  def getter_profile(:default) do
    %Operately.Repo.Getter.Profile{access_contexts: [:space_access_context, :project_access_context]}
  end

  def for_project(project) do
    case Repo.get_by(__MODULE__, project_id: project.id) do
      nil -> {:error, :bad_request}
      board -> {:ok, board}
    end
  end

  def for_space(%{default_task_board_id: nil}), do: {:error, :bad_request}

  def for_space(space) do
    case Repo.get_by(__MODULE__, id: space.default_task_board_id, space_id: space.id) do
      %__MODULE__{archived_at: nil} = board -> {:ok, board}
      _ -> {:error, :bad_request}
    end
  end

  def insert_for_project(multi, attrs \\ %{}) do
    Multi.insert(multi, :task_board, fn %{project: project} ->
      %{project_id: project.id} |> default_attrs() |> Map.merge(attrs) |> changeset()
    end)
  end

  def insert_for_space(multi, attrs \\ %{}) do
    Multi.insert(multi, :task_board, fn %{group: space} ->
      %{space_id: space.id} |> default_attrs() |> Map.merge(attrs) |> changeset()
    end)
  end

  defp default_attrs(owner) do
    statuses = Operately.Tasks.Status.default_task_statuses()

    Map.merge(owner, %{
      name: "Tasks",
      task_statuses: Enum.map(statuses, &Map.from_struct/1),
      tasks_kanban_state: Operately.Tasks.KanbanState.initialize(Enum.map(statuses, & &1.value))
    })
  end

  def owns_task?(board, task), do: {board.space_id, board.project_id} == {task.space_id, task.project_id}

  def check_writable(%__MODULE__{archived_at: nil}), do: :ok
  def check_writable(%__MODULE__{}), do: archived_error()

  def archived_error do
    {:error, {:bad_request, gettext("This task board is archived. Restore it before making changes."), %{code: "task_board_archived"}}}
  end

  def task_status_values(board) do
    board.task_statuses |> List.wrap() |> Enum.map(& &1.value) |> Enum.reject(&is_nil/1) |> Enum.map(&to_string/1)
  end

  def get_default_task_status(board) do
    statuses = board.task_statuses || []
    Enum.find(statuses, &(&1.color == :gray)) || Enum.find(statuses, &(&1.color == :blue)) || List.first(statuses)
  end
end
