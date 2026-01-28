defmodule Operately.SystemSettings.EmailConfig do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :provider, Ecto.Enum, values: [:smtp, :sendgrid]
    field :smtp_host, :string
    field :smtp_port, :integer
    field :smtp_username, :string
    field :smtp_ssl, :boolean
    field :smtp_tls_required, :boolean
  end

  def changeset(email_config, attrs) do
    email_config
    |> cast(attrs, [:provider, :smtp_host, :smtp_port, :smtp_username, :smtp_ssl, :smtp_tls_required])
  end
end
