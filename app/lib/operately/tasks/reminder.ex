defmodule Operately.Tasks.Reminder do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  @types [:before_due, :due_day, :overdue, :on_date]

  @type reminder_type :: :before_due | :due_day | :overdue | :on_date
  @type t :: %__MODULE__{
          type: reminder_type() | nil,
          days: integer() | nil,
          date: Date.t() | nil
        }

  embedded_schema do
    field :type, Ecto.Enum, values: @types
    field :days, :integer
    field :date, :date
  end

  def changeset(reminder, attrs) do
    reminder
    |> cast(attrs, [:type, :days, :date])
    |> validate_required([:type])
    |> validate_number(:days, greater_than: 0)
    |> validate_required_fields_for_type()
  end

  def due_relative?(%__MODULE__{type: type}), do: due_relative_type?(type)
  def due_relative?(attrs) when is_map(attrs), do: attrs |> reminder_type() |> due_relative_type?()

  defp reminder_type(attrs) do
    Map.get(attrs, :type) || Map.get(attrs, "type")
  end

  defp due_relative_type?(type) when type in [:before_due, :due_day, :overdue, "before_due", "due_day", "overdue"], do: true
  defp due_relative_type?(_type), do: false

  def due_today?(_due_date, nil, _today), do: false
  def due_today?(_due_date, [], _today), do: false

  def due_today?(due_date, reminders, %Date{} = today) do
    Enum.any?(reminders, &matches_today?(&1, due_date, today))
  end

  def due_today?(due_date, reminders) do
    due_today?(due_date, reminders, Date.utc_today())
  end

  defp matches_today?(%__MODULE__{type: :before_due, days: days}, %Date{} = due_date, today) when is_integer(days) do
    Date.diff(due_date, today) == days
  end

  defp matches_today?(%__MODULE__{type: :due_day}, %Date{} = due_date, today) do
    Date.diff(due_date, today) == 0
  end

  defp matches_today?(%__MODULE__{type: :overdue}, %Date{} = due_date, today) do
    Date.diff(due_date, today) < 0
  end

  defp matches_today?(%__MODULE__{type: :on_date, date: %Date{} = date}, _due_date, today) do
    Date.compare(date, today) == :eq
  end

  defp matches_today?(_reminder, _due_date, _today), do: false

  defp validate_required_fields_for_type(changeset) do
    case get_field(changeset, :type) do
      :before_due -> validate_required(changeset, [:days])
      :on_date -> validate_required(changeset, [:date])
      _ -> changeset
    end
  end
end
