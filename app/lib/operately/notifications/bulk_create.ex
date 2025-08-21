defmodule Operately.Notifications.BulkCreate do
  @moduledoc """
  Handles bulk creation of notifications with duplicate prevention.
  
  This module provides functionality to insert multiple notifications efficiently,
  with fallback handling for constraint violations (duplicates).
  """

  alias Operately.Notifications.Notification

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