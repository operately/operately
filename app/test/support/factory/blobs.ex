defmodule Operately.Support.Factory.Blobs do
  def add_blob(ctx, testid, author_name \\ :creator) do
    author = Map.fetch!(ctx, author_name)
    company = Map.fetch!(ctx, :company)

    blob = Operately.BlobsFixtures.blob_fixture(%{author_id: author.id, company_id: company.id})
    Map.put(ctx, testid, blob)
  end
end
