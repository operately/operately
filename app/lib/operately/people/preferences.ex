defmodule Operately.People.Preferences do
  use Operately.Schema

  @primary_key false

  defmodule Notifications do
    use Operately.Schema

    @primary_key false
    @email_window_minutes [5, 10, 15, 30, 60]
    @email_preference_values [:buffered, :mentions_only]

    embedded_schema do
      field :email_preference, Ecto.Enum, values: @email_preference_values, default: :buffered
      field :email_window_minutes, :integer, default: 5
      field :notify_about_assignments, :boolean, default: true
      field :notify_on_mention, :boolean, default: true
      field :send_daily_summary, :boolean, default: true
    end

    def changeset(notifications, attrs) do
      notifications
      |> cast(attrs, [:email_preference, :email_window_minutes, :notify_about_assignments, :notify_on_mention, :send_daily_summary])
      |> validate_inclusion(:email_window_minutes, @email_window_minutes)
    end

    def email_preference_values, do: @email_preference_values
    def email_window_minutes, do: @email_window_minutes
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
