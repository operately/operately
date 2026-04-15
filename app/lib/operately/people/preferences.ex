defmodule Operately.People.Preferences do
  use Operately.Schema

  @primary_key false

  defmodule Notifications do
    use Operately.Schema

    @primary_key false
    @email_window_minutes [5, 10, 15, 30, 60]
    @email_preference_values [:buffered]
    @daily_summary_delivery_times [
      "00:00",
      "01:00",
      "02:00",
      "03:00",
      "04:00",
      "05:00",
      "06:00",
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
      "22:00",
      "23:00"
    ]
    @default_daily_summary_delivery_time "18:00"

    embedded_schema do
      field :email_preference, Ecto.Enum, values: @email_preference_values, default: :buffered
      field :email_window_minutes, :integer, default: 5
      field :notify_about_assignments, :boolean, default: true
      field :notify_on_mention, :boolean, default: true
      field :send_daily_summary, :boolean, default: false
      field :daily_summary_delivery_time, :string, default: @default_daily_summary_delivery_time
    end

    def changeset(notifications, attrs) do
      notifications
      |> cast(attrs, [:email_preference, :email_window_minutes, :notify_about_assignments, :notify_on_mention, :send_daily_summary, :daily_summary_delivery_time])
      |> validate_inclusion(:email_window_minutes, @email_window_minutes)
      |> validate_inclusion(:daily_summary_delivery_time, @daily_summary_delivery_times)
    end

    def email_preference_values, do: @email_preference_values
    def email_window_minutes, do: @email_window_minutes
    def daily_summary_delivery_times, do: @daily_summary_delivery_times
    def default_daily_summary_delivery_time, do: @default_daily_summary_delivery_time
  end

  embedded_schema do
    embeds_one :notifications, Notifications, on_replace: :update, defaults_to_struct: true
  end

  def changeset(preferences, attrs) do
    preferences
    |> cast(attrs, [])
    |> cast_embed(:notifications, with: &Notifications.changeset/2)
  end
end
