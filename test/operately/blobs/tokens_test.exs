defmodule Operately.Blobs.TokensTest do
  use Operately.DataCase

  alias Operately.Blobs.Tokens

  test "encryption and validation" do
    token = Tokens.gen_upload_token("test.txt") 

    assert Tokens.validate("upload", "test.txt", token) == :ok
  end
end
