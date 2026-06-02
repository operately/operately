defmodule Operately.Tasks.Reminder do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  @types [:before_due, :due_day, :overdue]

  @type reminder_type :: :before_due | :due_day | :overdue
  @type t :: %__MODULE__{
          type: reminder_type() | nil,
          days: integer() | nil,
          enabled: boolean()
        }

  embedded_schema do
    field :type, Ecto.Enum, values: @types
    field :days, :integer
    field :enabled, :boolean, default: true
  end

  def changeset(reminder, attrs) do
    reminder
    |> cast(attrs, [:type, :days, :enabled])
    |> validate_required([:type, :enabled])
    |> validate_number(:days, greater_than: 0)
    |> validate_days_for_type()
  end

  def due_today?(nil, _reminders, _today), do: false
  def due_today?(_due_date, nil, _today), do: false
  def due_today?(_due_date, [], _today), do: false

  def due_today?(%Date{} = due_date, reminders, %Date{} = today) do
    Enum.any?(reminders, &matches_today?(&1, due_date, today))
  end

  def due_today?(%Date{} = due_date, reminders) do
    due_today?(due_date, reminders, Date.utc_today())
  end

  defp matches_today?(%__MODULE__{enabled: false}, _due_date, _today), do: false

  defp matches_today?(%__MODULE__{type: :before_due, days: days, enabled: true}, due_date, today) when is_integer(days) do
    Date.diff(due_date, today) == days
  end

  defp matches_today?(%__MODULE__{type: :due_day, enabled: true}, due_date, today) do
    Date.diff(due_date, today) == 0
  end

  defp matches_today?(%__MODULE__{type: :overdue, enabled: true}, due_date, today) do
    Date.diff(due_date, today) < 0
  end

  defp matches_today?(_reminder, _due_date, _today), do: false

  defp validate_days_for_type(changeset) do
    case get_field(changeset, :type) do
      :before_due -> validate_required(changeset, [:days])
      _ -> changeset
    end
  end
end
