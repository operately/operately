defmodule Operately.People.EmailChangeRequest do
  use Operately.Schema

  schema "email_change_requests" do
    belongs_to :account, Operately.People.Account
    field :stage, Ecto.Enum, values: [:current_email, :new_email]
    field :current_email_verified_at, :utc_datetime
    field :original_email, :string
    field :email, :string
    field :code_hash, :binary, redact: true
    field :expires_at, :utc_datetime
    field :sent_at, :utc_datetime
    field :attempts, :integer, default: 0
    field :invalidated_at, :utc_datetime
    timestamps()
  end
end
