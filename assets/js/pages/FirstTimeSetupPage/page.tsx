import * as React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";
import { Spacer } from "@/components/Spacer";
import { FilledButton } from "@/components/Button";


export function Page() {
  return (
    <Pages.Page title={"FirstTimeSetupPage"}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-2xl font-extrabold">Welcome to Operately!</div>
          <div className="text-content-accent">Let&apos;s set up your company.</div>

          <Spacer size={6} />

          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  return (
    <Forms.Form isValid={true} onSubmit={()=>{}}>
      <Forms.TextInput 
        label="Name of the company"
        placeholder="e.g. Acme Co."
        onChange={()=>{}}
        value=""
        error={false}
      />

      <Spacer />
      <AdminAccountTitle />
      <Spacer />

      <Forms.TextInput 
        label="Name"
        placeholder="e.g. John Johnson"
        onChange={()=>{}}
        value=""
        error={false}
      />
      <Forms.TextInput 
        label="Role in the company"
        placeholder="e.g. Founder"
        onChange={()=>{}}
        value=""
        error={false}
      />
      <Forms.TextInput 
        label="Password"
        onChange={()=>{}}
        value=""
        error={false}
      />
      <Forms.TextInput 
        label="Repeat password"
        onChange={()=>{}}
        value=""
        error={false}
      />

      <div className="flex items-center justify-center">
        <FilledButton>Submit</FilledButton>
      </div>
    </Forms.Form>
  )
}

function AdminAccountTitle() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-content-accent flex-1 h-[1px] bg-black"></div>
      <span className="text-content-accent text-center">ADMIN ACCOUNT</span>
      <div className="bg-content-accent flex-1 h-[1px] bg-black"></div>
    </div>
  )
}