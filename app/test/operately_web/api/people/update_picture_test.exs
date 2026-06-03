defmodule OperatelyWeb.Api.People.UpdatePictureTest do
  use OperatelyWeb.TurboCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.PeopleFixtures
  import Operately.BlobsFixtures

  alias OperatelyWeb.Paths

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:people, :update_picture], %{})
    end

    test "rejects unknown fields", ctx do
      assert {400, %{message: "Unknown input field: hacker"}} =
               mutation(ctx.conn, [:people, :update_picture], %{hacker: "value"})
    end
  end

  describe "updating another person's picture" do
    setup :register_and_log_in_account

    setup ctx do
      person =
        person_fixture(%{
          company_id: ctx.company.id,
          full_name: "Jane Doe"
        })

      Map.put(ctx, :company_member, person)
    end

    test "requires profile edit permissions", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id})

      assert {403, %{}} =
               mutation(ctx.conn, [:people, :update_picture], %{
                 person_id: Paths.person_id(ctx.company_member),
                 avatar_blob_id: Paths.blob_id(blob),
                 avatar_url: Operately.Blobs.Blob.url(blob)
               })

      person = Operately.People.get_person!(ctx.company_member.id)

      refute person.avatar_blob_id
      refute person.avatar_url
    end

    test "admins can update the picture", ctx do
      promote_me_to_admin(ctx)

      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id})

      assert {200, %{person: person}} =
               mutation(ctx.conn, [:people, :update_picture], %{
                 person_id: Paths.person_id(ctx.company_member),
                 avatar_blob_id: Paths.blob_id(blob),
                 avatar_url: Operately.Blobs.Blob.url(blob)
               })

      assert person.avatar_url == Operately.Blobs.Blob.url(blob)

      person = Operately.People.get_person!(ctx.company_member.id)
      assert person.avatar_blob_id == blob.id
      assert person.avatar_url == Operately.Blobs.Blob.url(blob)

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.status == :uploaded
    end
  end

  describe "updating my own picture" do
    setup :register_and_log_in_account

    test "sets avatar blob and url", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id})

      assert {200, %{person: person}} =
               mutation(ctx.conn, [:people, :update_picture], %{
                 person_id: Paths.person_id(ctx.person),
                 avatar_blob_id: Paths.blob_id(blob),
                 avatar_url: Operately.Blobs.Blob.url(blob)
               })

      assert person.avatar_url == Operately.Blobs.Blob.url(blob)

      person = Operately.People.get_person!(ctx.person.id)
      assert person.avatar_blob_id == blob.id
      assert person.avatar_url == Operately.Blobs.Blob.url(blob)

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.status == :uploaded
    end

    test "does not enqueue a limit email for avatar uploads", ctx do
      enable_billing(ctx.company)

      blob =
        blob_fixture(%{
          company_id: ctx.company.id,
          author_id: ctx.person.id,
          size: Operately.Billing.Plans.storage_limit_bytes(:free)
        })

      Oban.Testing.with_testing_mode(:manual, fn ->
        assert {200, _res} =
                 mutation(ctx.conn, [:people, :update_picture], %{
                   person_id: Paths.person_id(ctx.person),
                   avatar_blob_id: Paths.blob_id(blob),
                   avatar_url: Operately.Blobs.Blob.url(blob)
                 })

        refute_enqueued worker: Operately.Billing.LimitBreachAlertEmailWorker
      end)
    end

    test "clears avatar when values are nil", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id})

      {:ok, _} = Operately.People.update_person(ctx.person, %{avatar_blob_id: blob.id, avatar_url: Operately.Blobs.Blob.url(blob)})

      assert {200, %{person: person}} =
               mutation(ctx.conn, [:people, :update_picture], %{
                 person_id: Paths.person_id(ctx.person),
                 avatar_blob_id: nil,
                 avatar_url: nil
               })

      assert is_nil(person.avatar_url)

      person = Operately.People.get_person!(ctx.person.id)
      refute person.avatar_blob_id
      refute person.avatar_url
    end
  end

  defp promote_me_to_admin(ctx) do
    group = Operately.Access.get_group!(company_id: ctx.company.id, tag: :full_access)
    changeset = Operately.Access.GroupMembership.changeset(%{group_id: group.id, person_id: ctx.person.id})
    Operately.Repo.insert(changeset)
  end

  defp enable_billing(company) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

    {:ok, _company} = Operately.Companies.enable_experimental_feature(company, "billing")
  end
end
