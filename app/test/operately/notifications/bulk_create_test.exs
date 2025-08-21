defmodule Operately.Notifications.BulkCreateTest do
  use Operately.DataCase

  alias Operately.Notifications.BulkCreate
  alias Operately.Notifications.Notification
  alias Operately.Repo

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ActivitiesFixtures

  describe "insert_notifications/2" do
    setup do
      company = company_fixture()
      person = person_fixture(company_id: company.id)
      activity = activity_fixture(%{author_id: person.id})

      {:ok, company: company, person: person, activity: activity}
    end

    test "successfully inserts notifications when no duplicates exist", %{person: person, activity: activity} do
      notifications = [
        %{
          person_id: person.id,
          activity_id: activity.id,
          should_send_email: true,
          read: false,
          inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
          updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
        }
      ]

      {:ok, result} = BulkCreate.insert_notifications(Repo, notifications)

      assert length(result) == 1
      [notification] = result
      assert notification.person_id == person.id
      assert notification.should_send_email == true
      assert is_integer(notification.id)
    end

    test "handles multiple notifications in bulk insert", %{person: person, activity: activity} do
      company2 = company_fixture()
      person2 = person_fixture(company_id: company2.id)
      activity2 = activity_fixture(%{author_id: person2.id})

      notifications = [
        %{
          person_id: person.id,
          activity_id: activity.id,
          should_send_email: true,
          read: false,
          inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
          updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
        },
        %{
          person_id: person2.id,
          activity_id: activity2.id,
          should_send_email: false,
          read: false,
          inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
          updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
        }
      ]

      {:ok, result} = BulkCreate.insert_notifications(Repo, notifications)

      assert length(result) == 2
      person_ids = Enum.map(result, & &1.person_id)
      assert person.id in person_ids
      assert person2.id in person_ids
    end

    test "gracefully handles duplicate notifications by skipping them", %{person: person, activity: activity} do
      notification_attrs = %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: false,
        read: false,
        inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
        updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
      }

      # First insert should succeed
      {:ok, first_result} = BulkCreate.insert_notifications(Repo, [notification_attrs])
      assert length(first_result) == 1

      # Second insert with same data should gracefully skip duplicates
      {:ok, second_result} = BulkCreate.insert_notifications(Repo, [notification_attrs])
      assert length(second_result) == 0

      # Verify only one notification exists in the database
      count = Repo.aggregate(
        from(n in Notification, where: n.person_id == ^person.id and n.activity_id == ^activity.id),
        :count
      )
      assert count == 1
    end

    test "handles mixed scenario: some new, some duplicate notifications", %{person: person, activity: activity} do
      company2 = company_fixture()
      person2 = person_fixture(company_id: company2.id)
      activity2 = activity_fixture(%{author_id: person2.id})

      # Create first notification directly in database
      {:ok, _existing} = Repo.insert(%Notification{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: false,
        read: false
      })

      # Try to insert: one duplicate, one new
      notifications = [
        %{
          person_id: person.id,
          activity_id: activity.id,
          should_send_email: true,
          read: false,
          inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
          updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
        },
        %{
          person_id: person2.id,
          activity_id: activity2.id,
          should_send_email: false,
          read: false,
          inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
          updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
        }
      ]

      {:ok, result} = BulkCreate.insert_notifications(Repo, notifications)

      # Should only insert the new one, skip the duplicate
      assert length(result) == 1
      [new_notification] = result
      assert new_notification.person_id == person2.id
    end

    test "returns empty list when all notifications are duplicates", %{person: person, activity: activity} do
      # Create notification directly in database first
      {:ok, _existing} = Repo.insert(%Notification{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: false,
        read: false
      })

      # Try to insert the same notification
      notifications = [
        %{
          person_id: person.id,
          activity_id: activity.id,
          should_send_email: true,
          read: false,
          inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
          updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
        }
      ]

      {:ok, result} = BulkCreate.insert_notifications(Repo, notifications)
      assert result == []
    end
  end

  describe "bulk_create/1" do
    setup do
      company = company_fixture()
      person = person_fixture(company_id: company.id)
      activity = activity_fixture(%{author_id: person.id})

      {:ok, company: company, person: person, activity: activity}
    end

    test "successfully creates notifications with the full workflow", %{person: person, activity: activity} do
      notifications = [
        %{
          person_id: person.id,
          activity_id: activity.id,
          should_send_email: false, # Use false to avoid external dependencies
          read: false
        }
      ]

      {:ok, result} = BulkCreate.bulk_create(notifications)

      assert length(result) == 1
      [notification] = result
      assert notification.person_id == person.id
      assert notification.should_send_email == false
      assert is_integer(notification.id)
    end

    test "handles multiple notifications in the full workflow", %{person: person, activity: activity} do
      company2 = company_fixture()
      person2 = person_fixture(company_id: company2.id)
      activity2 = activity_fixture(%{author_id: person2.id})

      notifications = [
        %{
          person_id: person.id,
          activity_id: activity.id,
          should_send_email: false,
          read: false
        },
        %{
          person_id: person2.id,
          activity_id: activity2.id,
          should_send_email: false,
          read: false
        }
      ]

      {:ok, result} = BulkCreate.bulk_create(notifications)

      assert length(result) == 2
      person_ids = Enum.map(result, & &1.person_id)
      assert person.id in person_ids
      assert person2.id in person_ids
    end
  end
end