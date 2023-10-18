defmodule Mix.Tasks.Operately.Gen.Page do
  def run([name]) do
    page_name = Macro.camelize(name) <> "Page"

    File.mkdir_p("assets/js/pages/#{page_name}")

    generate_loader(page_name)
    generate_page(page_name)
    generate_index(page_name)
  end

  def generate_index(page_name) do
    generate_file("assets/js/pages/#{page_name}/index.tsx", fn _path ->
      """
      export { loader } from "./loader";
      export { Page } from "./page";
      """
    end)
  end

  def generate_loader(page_name) do
    generate_file("assets/js/pages/#{page_name}/loader.tsx", fn _path ->
      """
      import * as Paper from "@/components/PaperContainer";

      export interface LoaderResult {
      }

      export async function loader({params}) : Promise<LoaderResult> {
        // TODO: Implement

        return {}
      }

      export function useLoadedData() : LoaderResult {
        const [data, _] = Paper.useLoadedData() as [LoaderResult, () => void];

        return data;
      }
      """
    end)
  end

  def generate_page(page_name) do
    generate_file("assets/js/pages/#{page_name}/page.tsx", fn _path ->
      """
      import * as React from "react";
      import * as Paper from "@/components/PaperContainer";

      import { useLoadedData } from "./loader";
      import { useDocumentTitle } from "@/layouts/header";
      
      export function Page() {
        const data = useLoadedData();

        useDocumentTitle("#{page_name}");
      
        return (
          <Paper.Root>
            <Paper.Body>
              <div className="text-white-1 text-3xl font-extrabold">#{page_name}</div>
            </Paper.Body>
          </Paper.Root>
        );
      }
      """
    end)
  end

  def generate_file(path, generator) do
    IO.puts "#{IO.ANSI.green()}Generating#{IO.ANSI.reset()} #{path}"

    File.write!(path, generator.(path))
  end

end
