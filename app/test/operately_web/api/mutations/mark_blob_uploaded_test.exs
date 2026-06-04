defmodule OperatelyWeb.Api.Mutations.MarkBlobUploadedTest do
  use OperatelyWeb.TurboCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.BlobsFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :mark_blob_uploaded, %{})
    end
  end

  describe "mark_blob_uploaded functionality" do
    setup :register_and_log_in_account

    test "marks a pending blob as uploaded", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id})

      assert {200, res} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: blob.id})

      assert res.blob.id == Paths.blob_id(blob)
      assert res.blob.status == "uploaded"

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.status == :uploaded
    end

    test "is idempotent for already uploaded blobs", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id, status: :uploaded})

      assert {200, res} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: blob.id})
      assert res.blob.status == "uploaded"

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.status == :uploaded
    end

    test "enqueues a near-limit warning email when uploaded storage reaches 90 percent", ctx do
      enable_billing(ctx.company)
      threshold = Operately.Billing.EnforceLimits.near_limit_threshold(Operately.Billing.Plans.storage_limit_bytes(:free))

      blob_fixture(%{
        company_id: ctx.company.id,
        author_id: ctx.person.id,
        status: :uploaded,
        size: threshold - 1
      })

      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.person.id, size: 1})

      Oban.Testing.with_testing_mode(:manual, fn ->
        assert {200, _res} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: blob.id})
        assert length(all_enqueued(worker: Operately.Billing.NearLimitAlertEmailWorker)) == 1
      end)
    end

    test "does not allow marking another person's blob", ctx do
      other_person = person_fixture(%{company_id: ctx.company.id})
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: other_person.id})

      assert {403, %{}} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: blob.id})

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.status == :pending
    end

    test "returns 404 for a missing blob", ctx do
      assert {404, res} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: Ecto.UUID.generate()})
      assert res.message == "The requested resource was not found"
    end
  end

  describe "mark_blob_uploaded for import artifacts" do
    setup ctx do
      ctx
      |> Factory.add_account(:account)
      |> Factory.log_in_account(:account)
    end

    test "allows the staging account to mark an import artifact blob as uploaded", ctx do
      blob =
        blob_fixture(%{
          purpose: :company_transfer_import_artifact,
          account_id: ctx.account.id,
          author_id: nil,
          company_id: nil
        })

      assert {200, res} = mutation(ctx.conn, :mark_blob_uploaded, %{blob_id: blob.id})

      assert res.blob.id == Paths.blob_id(blob)
      assert res.blob.status == "uploaded"

      blob = Operately.Blobs.get_blob!(blob.id)
      assert blob.status == :uploaded

      refute_enqueued worker: Operately.Billing.NearLimitAlertEmailWorker
    end
  end

  defp enable_billing(company) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

    {:ok, _company} = Operately.Companies.enable_experimental_feature(company, "billing")
  end
end
