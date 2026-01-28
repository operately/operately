defmodule Operately.SystemSettings.Settings do
  use Operately.Schema

  alias Operately.SystemSettings.EmailSecrets

  schema "system_settings" do
    field :key, :string
    embeds_one :email_config, Operately.SystemSettings.EmailConfig, on_replace: :update, source: :data
    field :email_secrets, Operately.SystemSettings.EncryptedEmailSecrets

    timestamps()
  end

  def changeset(settings, attrs) do
    settings
    |> cast(attrs, [:key, :email_secrets])
    |> cast_embed(:email_config)
    |> put_default_email_secrets()
    |> validate_required([:key])
    |> unique_constraint(:key)
  end

  defp put_default_email_secrets(changeset) do
    case {get_change(changeset, :email_secrets), get_field(changeset, :email_secrets)} do
      {nil, nil} -> put_change(changeset, :email_secrets, %EmailSecrets{})
      _ -> changeset
    end
  end
end
