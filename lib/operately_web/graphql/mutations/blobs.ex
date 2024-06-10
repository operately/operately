defmodule OperatelyWeb.Graphql.Mutations.Blobs do
  use Absinthe.Schema.Notation

  input_object :blob_input do
    field :filename, non_null(:string)
  end

  object :blob_mutations do
    field :create_blob, non_null(:blob) do
      arg :input, non_null(:blob_input)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        if System.get_env("OPERATELY_STORAGE_TYPE") == "s3" do
          Operately.Blobs.create_blob(%{
            company_id: person.company_id,
            author_id: person.id,
            status: :pending,
            filename: args.input.filename,
            storage_type: :s3
          })
        else
          Operately.Blobs.create_blob(%{
            company_id: person.company_id,
            author_id: person.id,
            status: :pending,
            filename: args.input.filename,
            storage_type: :local
          })
        end
      end
    end
  end
end
