defmodule Operately.SystemSettings.Settings do
  use Operately.Schema

  schema "system_settings" do
    field :key, :string
    field :data, :map, default: %{}
    field :secrets, Operately.SystemSettings.EncryptedMap

    timestamps()
  end

  def changeset(settings, attrs) do
    settings
    |> cast(attrs, [:key, :data, :secrets])
    |> put_default_secrets()
    |> validate_required([:key, :data, :secrets])
    |> unique_constraint(:key)
  end

  defp put_default_secrets(changeset) do
    case {get_change(changeset, :secrets), get_field(changeset, :secrets)} do
      {nil, nil} -> put_change(changeset, :secrets, %{})
      _ -> changeset
    end
  end
end
