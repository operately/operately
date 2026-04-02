defmodule Operately.People.Preferences do
  use Operately.Schema

  @primary_key false

  defmodule Notifications do
    use Operately.Schema

    @primary_key false

    embedded_schema do
      field :notify_about_assignments, :boolean, default: true
      field :notify_on_mention, :boolean, default: true
      field :send_daily_summary, :boolean, default: true
    end

    def changeset(notifications, attrs) do
      notifications
      |> cast(attrs, [:notify_about_assignments, :notify_on_mention, :send_daily_summary])
    end
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
