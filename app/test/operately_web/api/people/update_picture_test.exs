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

  describe "blob authorization" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:other)
      |> Factory.add_blob(:blob)
      |> Factory.log_in_person(:creator)
    end

    for kind <- [:foreign, :another_author, :deleted, :import_artifact, :missing] do
      @invalid_kind kind

      test "rejects #{@invalid_kind} blobs without changing the avatar or blob", ctx do
        blob_id = invalid_blob_id(ctx, @invalid_kind)
        blobs = Repo.all(Operately.Blobs.Blob)
        person = Repo.reload(ctx.creator)

        assert {404, _} =
                 mutation(ctx.conn, [:people, :update_picture], %{
                   person_id: Paths.person_id(ctx.creator),
                   avatar_blob_id: blob_id,
                   avatar_url: "/blobs/#{blob_id}"
                 })

        assert Repo.reload(person) == person
        Enum.each(blobs, fn blob -> assert Repo.reload(blob) == blob end)
      end
    end

    test "external API enforces blob ownership and read-only tokens", ctx do
      ctx = ctx |> Factory.add_api_token(:token, :creator, read_only: false) |> Factory.add_api_token(:read_token, :creator)
      blob_id = invalid_blob_id(ctx, :foreign)
      inputs = %{person_id: Paths.person_id(ctx.creator), avatar_blob_id: blob_id, avatar_url: "/blobs/#{blob_id}"}

      assert {404, _} = external_mutation(ctx.conn, ctx.token, "people/update_picture", inputs)
      assert Repo.reload(ctx.creator).avatar_blob_id == nil
      assert Operately.Blobs.get_blob!(blob_id).status == :pending

      inputs = %{inputs | avatar_blob_id: ctx.blob.id, avatar_url: Operately.Blobs.Blob.url(ctx.blob)}
      assert {403, _} = external_mutation(ctx.conn, ctx.read_token, "people/update_picture", inputs)
      assert Repo.reload(ctx.blob).status == :pending
      assert {200, _} = external_mutation(ctx.conn, ctx.token, "people/update_picture", inputs)
    end

    test "marks an uppercase avatar UUID as uploaded", ctx do
      assert {200, _} =
               mutation(ctx.conn, [:people, :update_picture], %{
                 person_id: Paths.person_id(ctx.creator),
                 avatar_blob_id: String.upcase(ctx.blob.id),
                 avatar_url: Operately.Blobs.Blob.url(ctx.blob)
               })

      assert Repo.reload(ctx.creator).avatar_blob_id == ctx.blob.id
      assert Repo.reload(ctx.blob).status == :uploaded
    end

    test "accepts the caller's already uploaded blob", ctx do
      {:ok, _} = Operately.Blobs.update_blob(ctx.blob, %{status: :uploaded})

      assert {200, _} =
               mutation(ctx.conn, [:people, :update_picture], %{
                 person_id: Paths.person_id(ctx.creator),
                 avatar_blob_id: ctx.blob.id,
                 avatar_url: Operately.Blobs.Blob.url(ctx.blob)
               })
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
      enable_billing()

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
        refute_enqueued worker: Operately.Billing.NearLimitAlertEmailWorker
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

  defp enable_billing do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)
  end

  defp invalid_blob_id(ctx, kind) do
    case kind do
      :foreign ->
        foreign = %{} |> Factory.setup() |> Factory.add_blob(:blob)
        foreign.blob.id

      :another_author ->
        Factory.add_blob(ctx, :other_blob, :other).other_blob.id

      :deleted ->
        blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :deleted}).id

      :import_artifact ->
        blob_fixture(%{purpose: :company_transfer_import_artifact, account_id: ctx.account.id}).id

      :missing ->
        Ecto.UUID.generate()
    end
  end
end
