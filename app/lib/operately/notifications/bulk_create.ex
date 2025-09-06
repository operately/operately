defmodule Operately.Notifications.BulkCreate do
  @moduledoc """
  Handles bulk creation of notifications with duplicate prevention.
  
  This module provides functionality to insert multiple notifications efficiently,
  with fallback handling for constraint violations (duplicates), and manages
  the complete workflow including email scheduling and socket broadcasting.
  """

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Notifications.Notification
  alias Operately.Notifications.EmailWorker

  @doc """
  Creates multiple notifications with email scheduling and broadcasting.
  
  This is the main entry point for bulk notification creation. It handles:
  - Timestamping notifications
  - Bulk insertion with duplicate prevention
  - Email job scheduling for notifications that require it
  - Broadcasting unread count updates to affected users
  
  ## Parameters
  
  - `notifications`: List of notification attribute maps to create
  
  ## Returns
  
  `{:ok, inserted_notifications}` on success or `{:error, :failed_to_create_notifications}` on failure.
  """
  def bulk_create(notifications) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    notifications = Enum.map(notifications, fn notification ->
      Map.merge(notification, %{inserted_at: now, updated_at: now})
    end)

    Multi.new()
    |> Multi.run(:notifications, fn repo, _ ->
      insert_notifications(repo, notifications)
    end)
    |> Multi.merge(fn %{notifications: notifications} ->
      Enum.reduce(notifications, Ecto.Multi.new(), fn notification, multi ->
        if notification.should_send_email do
          Ecto.Multi.run(multi, "email_#{notification.id}", fn _repo, _ ->
            EmailWorker.new(%{notification_id: notification.id}) |> Oban.insert()
          end)
        else
          multi
        end
      end)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{notifications: notifications}} ->
        unique_person_ids = Enum.uniq(Enum.map(notifications, &(&1.person_id)))

        Enum.each(unique_person_ids, fn person_id ->
          OperatelyWeb.ApiSocket.broadcast!("api:unread_notifications_count:#{person_id}")
        end)

        {:ok, notifications}
      {:error, _} ->
        {:error, :failed_to_create_notifications}
    end
  end

  @doc """
  Inserts multiple notifications into the database.
  
  First attempts a bulk insert for efficiency. If a unique constraint error occurs,
  falls back to inserting notifications one by one, skipping any duplicates.
  
  ## Parameters
  
  - `repo`: The Ecto repository to use for database operations
  - `notifications`: List of notification attribute maps to insert
  
  ## Returns
  
  `{:ok, inserted_notifications}` where `inserted_notifications` is a list of maps
  containing the `:id`, `:should_send_email`, and `:person_id` of successfully inserted notifications.
  
  ## Examples
  
      iex> notifications = [%{person_id: 1, activity_id: 2, should_send_email: true}]
      iex> Operately.Notifications.BulkCreate.insert_notifications(repo, notifications)
      {:ok, [%{id: 123, should_send_email: true, person_id: 1}]}
  """
  def insert_notifications(repo, notifications) do
    try do
      {_, inserted_notifications} = repo.insert_all(
        Notification, 
        notifications, 
        returning: [:id, :should_send_email, :person_id]
      )
      {:ok, inserted_notifications}
    rescue
      Postgrex.Error ->
        insert_notifications_individually(repo, notifications)
      Ecto.ConstraintError ->
        insert_notifications_individually(repo, notifications)
    end
  end

  # Private function to handle individual notification insertion when bulk insert fails
  defp insert_notifications_individually(repo, notifications) do
    notifications_inserted = Enum.reduce(notifications, [], fn notification_attrs, acc ->
      case repo.insert(%Notification{} |> Notification.changeset(notification_attrs)) do
        {:ok, notification} -> 
          [%{
            id: notification.id, 
            should_send_email: notification.should_send_email, 
            person_id: notification.person_id
          } | acc]
        {:error, _} -> 
          acc # Skip duplicates
      end
    end)
    
    {:ok, Enum.reverse(notifications_inserted)}
  end
end