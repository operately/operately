defmodule Operately.Notifications.EmailBatch do
  use Operately.Schema
  import Ecto.Query

  schema "notification_email_batches" do
    belongs_to :person, Operately.People.Person
    belongs_to :access_context, Operately.Access.Context

    has_many :notifications, Operately.Notifications.Notification, foreign_key: :email_batch_id

    field :status, Ecto.Enum, values: [:scheduled, :sending, :sent, :failed, :skipped], default: :scheduled
    field :window_started_at, :naive_datetime
    field :send_at, :naive_datetime
    field :sent_at, :naive_datetime
    field :error, :string

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(email_batch, attrs) do
    email_batch
    |> cast(attrs, [:person_id, :access_context_id, :status, :window_started_at, :send_at, :sent_at, :error])
    |> validate_required([:person_id, :access_context_id, :status, :window_started_at, :send_at])
  end

  def scheduled(query \\ __MODULE__) do
    from(batch in query, where: batch.status == :scheduled)
  end

  def active(query \\ __MODULE__) do
    from(batch in query, where: batch.status in [:scheduled, :sending])
  end

  def due_for_delivery(query \\ __MODULE__, now \\ current_time()) do
    from(batch in query, where: batch.send_at <= ^now)
  end

  def for_person_and_context(query \\ __MODULE__, person_id, access_context_id) do
    from(batch in query,
      where: batch.person_id == ^person_id and batch.access_context_id == ^access_context_id
    )
  end

  defp current_time do
    NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
  end
end
