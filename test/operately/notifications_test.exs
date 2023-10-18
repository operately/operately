defmodule Operately.NotificationsTest do
  use Operately.DataCase

  alias Operately.Notifications

  describe "notifications" do
    alias Operately.Notifications.Notification

    import Operately.NotificationsFixtures

    @invalid_attrs %{email_sent: nil, email_sent_at: nil, read: nil, read_at: nil, should_send_email: nil}

    test "list_notifications/0 returns all notifications" do
      notification = notification_fixture()
      assert Notifications.list_notifications() == [notification]
    end

    test "get_notification!/1 returns the notification with given id" do
      notification = notification_fixture()
      assert Notifications.get_notification!(notification.id) == notification
    end

    test "create_notification/1 with valid data creates a notification" do
      valid_attrs = %{email_sent: true, email_sent_at: ~N[2023-10-17 13:34:00], read: true, read_at: ~N[2023-10-17 13:34:00], should_send_email: true}

      assert {:ok, %Notification{} = notification} = Notifications.create_notification(valid_attrs)
      assert notification.email_sent == true
      assert notification.email_sent_at == ~N[2023-10-17 13:34:00]
      assert notification.read == true
      assert notification.read_at == ~N[2023-10-17 13:34:00]
      assert notification.should_send_email == true
    end

    test "create_notification/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Notifications.create_notification(@invalid_attrs)
    end

    test "update_notification/2 with valid data updates the notification" do
      notification = notification_fixture()
      update_attrs = %{email_sent: false, email_sent_at: ~N[2023-10-18 13:34:00], read: false, read_at: ~N[2023-10-18 13:34:00], should_send_email: false}

      assert {:ok, %Notification{} = notification} = Notifications.update_notification(notification, update_attrs)
      assert notification.email_sent == false
      assert notification.email_sent_at == ~N[2023-10-18 13:34:00]
      assert notification.read == false
      assert notification.read_at == ~N[2023-10-18 13:34:00]
      assert notification.should_send_email == false
    end

    test "update_notification/2 with invalid data returns error changeset" do
      notification = notification_fixture()
      assert {:error, %Ecto.Changeset{}} = Notifications.update_notification(notification, @invalid_attrs)
      assert notification == Notifications.get_notification!(notification.id)
    end

    test "delete_notification/1 deletes the notification" do
      notification = notification_fixture()
      assert {:ok, %Notification{}} = Notifications.delete_notification(notification)
      assert_raise Ecto.NoResultsError, fn -> Notifications.get_notification!(notification.id) end
    end

    test "change_notification/1 returns a notification changeset" do
      notification = notification_fixture()
      assert %Ecto.Changeset{} = Notifications.change_notification(notification)
    end
  end
end
