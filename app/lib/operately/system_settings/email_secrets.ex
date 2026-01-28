defmodule Operately.SystemSettings.EmailSecrets do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :sendgrid_api_key, :string
    field :smtp_password, :string
  end

  def changeset(email_secrets, attrs) do
    email_secrets
    |> cast(attrs, [:sendgrid_api_key, :smtp_password])
  end
end
